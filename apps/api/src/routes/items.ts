import { Router, Request, Response } from "express";
import type { ItemType, ProcessingStatus, SaveSource } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";
import { deleteEmbedding, fetchEmbedding, queryEmbedding } from "@/lib/vectorDB";
import { upload } from "@/middleware/upload";
import { UploadValidationError, validateUploadBuffer } from "@/middleware/uploadContract";
import { QueueUnavailableError, scrapeQueue, aiQueue } from "@/queues";
import { buildPipelineJobId } from "@/queues/pipeline";
import { buildKey, deleteFile, uploadFile } from "@/lib/storage";
import {
  normalizeSaveMetadata,
  normalizeSaveUrl,
  parseYoutubeTimestamp,
  SaveValidationError,
} from "./saveContract";
import { invalidateGraphCache } from "../lib/graphCache";

const router = Router();
const ITEM_TYPES: ItemType[] = ["article", "tweet", "youtube", "pdf", "image", "podcast", "instagram", "linkedin", "link"];
const PROCESSING_STATUSES: ProcessingStatus[] = ["pending", "processing", "ready", "failed"];
const SAVE_SOURCES: SaveSource[] = ["extension", "web_url", "web_upload"];

class OwnershipError extends Error {
  readonly status = 404;

  constructor(message: string) {
    super(message);
    this.name = "OwnershipError";
  }
}

async function requireOwnedCollection(userId: string, collectionId: unknown): Promise<void> {
  if (typeof collectionId !== "string" || collectionId.trim().length === 0) return;

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });

  if (!collection) throw new OwnershipError("Collection not found");
}

function isItemType(value: unknown): value is ItemType {
  return typeof value === "string" && ITEM_TYPES.includes(value as ItemType);
}

function isProcessingStatus(value: unknown): value is ProcessingStatus {
  return typeof value === "string" && PROCESSING_STATUSES.includes(value as ProcessingStatus);
}

function isSaveSource(value: unknown): value is SaveSource {
  return typeof value === "string" && SAVE_SOURCES.includes(value as SaveSource);
}

function parseBoundedPositiveInt(value: unknown, fallback: number, maximum: number): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function normalizeTagsInput(value: unknown): string[] {
  if (!Array.isArray(value) && typeof value !== "string") return [];
  const raw = Array.isArray(value) ? value : [value];

  return Array.from(
    new Set(
      raw
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    )
  );
}

function detectItemTypeFromUrl(rawUrl: string): ItemType {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("twitter.com") || host.includes("x.com")) return "tweet";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("linkedin.com")) return "linkedin";
    if (path.endsWith(".pdf")) return "pdf";
  } catch {
    // Ignore URL parsing failures and fallback to generic link.
  }

  return "link";
}

// Apply auth to all item routes
router.use(authenticateClerk);

/**
 * @route   POST /items/upload
 * @desc    Upload a file (PDF or Image)
 */
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { title, author, podcastName, itemType, tags, collectionId, note } = req.body;
  const file = req.file;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    validateUploadBuffer(file.buffer, file.mimetype);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return res.status(error.status).json({ error: error.message, code: "INVALID_UPLOAD" });
    }
    throw error;
  }

  const metadata = normalizeSaveMetadata({ title, author, podcastName, note });
  if (!metadata.title) {
    return res.status(400).json({ error: "Title is required for uploads" });
  }

  let item: any;
  let uploadedFile: { key: string; url: string } | null = null;
  try {
    await requireOwnedCollection(userId, collectionId);
    const normalizedTags = normalizeTagsInput(tags);
    const inferredType: ItemType =
      isItemType(itemType) ? itemType : file.mimetype.startsWith("image") ? "image" : "pdf";
    const key = buildKey(userId, "files", file.originalname);
    const uploaded = await uploadFile(file.buffer, key, file.mimetype);
    uploadedFile = uploaded;

    item = await prisma.item.create({
      data: {
        userId,
        title: metadata.title,
        itemType: inferredType,
        saveSource: "web_upload",
        author: metadata.author,
        podcastName: metadata.podcastName,
        userNote: metadata.note,
        fileUrl: uploadedFile.url,
        thumbnailUrl: inferredType === "image" ? uploadedFile.url : null,
        sourceDomain: "upload",
        status: "processing",
        processingStage: "ai",
        // If collection provided
        ...(collectionId && {
          collections: {
            create: { collectionId },
          },
        }),
        // If tags provided manually
        ...(normalizedTags.length > 0 && {
          tags: {
            create: normalizedTags.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId, name: tagName } },
                  create: { userId, name: tagName },
                },
              },
              confidence: 1.0,
            })),
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
      },
    });
    await invalidateGraphCache(userId);

  } catch (error) {
    if (error instanceof OwnershipError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    let cleanupError: string | null = null;
    if (uploadedFile) {
      try {
        await deleteFile(uploadedFile.key);
      } catch (cleanupFailure: any) {
        cleanupError = cleanupFailure?.message || "Uploaded file cleanup failed";
        console.error(`[Items] Failed to clean up orphaned upload ${uploadedFile.key}:`, cleanupFailure);
      }
    }
    return res.status(500).json({
      error: "Failed to upload item metadata",
      recovery: cleanupError
        ? { storageKey: uploadedFile?.key, action: "Delete this orphaned object from storage." }
        : undefined,
    });
  }

  try {
    await aiQueue.add(
      "process-upload",
      { itemId: item.id, userId },
      { jobId: buildPipelineJobId("ai", item.id, item.processingAttempt ?? 0) },
    );
  } catch (error) {
    const message = getQueueFailureMessage(error);
    await markQueueFailure(item.id, message);
    return res.status(503).json({
      error: "Item saved, but processing could not be queued.",
      reason: message,
      item: mapItemWithTags({ ...item, status: "failed", processingStage: "queue", processingError: message }),
      retryable: true,
    });
  }

  return res.status(201).json(mapItemWithTags(item));
});

/**
 * Helper to map Prisma item tags to the frontend ItemTag interface
 */
const mapItemWithTags = (item: any) => ({
  ...item,
  tags: item.tags?.map((t: any) => ({
    tagId: t.tag.id,
    tagName: t.tag.name,
    tagColor: t.tag.color || null,
    isAiGenerated: t.isAiGenerated || false,
    confidence: t.confidence || 1.0,
  })) || [],
});

function getQueueFailureMessage(error: unknown): string {
  if (error instanceof QueueUnavailableError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "The processing queue could not accept this item.";
}

async function markQueueFailure(itemId: string, message: string): Promise<void> {
  await prisma.item.update({
    where: { id: itemId },
    data: {
      status: "failed",
      processingStage: "queue",
      processingError: message,
    },
  }).catch((updateError: unknown) => {
    console.error(`[Items] Failed to persist queue failure for ${itemId}:`, updateError);
  });
}

async function requeueStaleItems(userId: string) {
  const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
  const staleItems = await prisma.item.findMany({
    where: {
      userId,
      status: { in: ["pending", "processing"] },
      savedAt: { lt: staleThreshold },
    },
    select: {
      id: true,
      url: true,
      title: true,
      description: true,
      contentText: true,
      status: true,
      processingAttempt: true,
    },
    take: 10,
  });

  let requeued = 0;
  let failed = 0;

  for (const stale of staleItems) {
    const hasUsefulScrapeData = Boolean(
      stale.contentText || stale.description || (stale.title && stale.title !== "Untitled")
    );
    const stage = stale.url && !hasUsefulScrapeData ? "scrape" : "ai";
    const nextAttempt = stale.processingAttempt + 1;

    try {
      const claimed = await prisma.item.updateMany({
        where: {
          id: stale.id,
          userId,
          status: { in: ["pending", "processing"] },
          processingAttempt: stale.processingAttempt,
        },
        data: {
          processingAttempt: { increment: 1 },
          processingStage: stage,
          processingError: null,
          status: stage === "scrape" ? "pending" : "processing",
        },
      });

      if (claimed.count !== 1) continue;

      if (stage === "scrape" && stale.url) {
        await scrapeQueue.add(
          "retry-stale-scrape",
          { itemId: stale.id, url: stale.url, userId },
          { jobId: buildPipelineJobId("scrape", stale.id, nextAttempt) },
        );
      } else {
        await aiQueue.add(
          "retry-stale-ai",
          { itemId: stale.id, userId },
          { jobId: buildPipelineJobId("ai", stale.id, nextAttempt) },
        );
      }
      requeued += 1;
    } catch (error: any) {
      failed += 1;
      const message = getQueueFailureMessage(error);
      await markQueueFailure(stale.id, message);
      console.warn(`[Items] Failed to requeue stale item ${stale.id}:`, message);
    }
  }

  if (staleItems.length > 0) {
    console.info(`[Items] Stale recovery: inspected=${staleItems.length} requeued=${requeued} failed=${failed}`);
  }

  return { inspected: staleItems.length, requeued, failed };
}

/**
 * @route   GET /items
 * @desc    List all items for user
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await requeueStaleItems(userId);

    const { type, status, favorite, archived, page, limit, sort, tag, source } = req.query;
    const normalizedType = isItemType(type) ? type : undefined;
    const normalizedStatus = isProcessingStatus(status) ? status : undefined;
    const normalizedSource = isSaveSource(source) ? source : undefined;
    const normalizedTag = typeof tag === "string" && tag.trim().length > 0 ? tag.trim() : undefined;
    
    const pageNum = parseBoundedPositiveInt(page, 1, 1_000_000);
    const limitNum = parseBoundedPositiveInt(limit, 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      ...(normalizedType && { itemType: normalizedType }),
      ...(normalizedStatus && { status: normalizedStatus }),
      ...(normalizedSource && { saveSource: normalizedSource }),
      ...(normalizedTag && {
        tags: {
          some: {
            tag: { userId, name: normalizedTag },
          },
        },
      }),
      ...(favorite === "true" && { isFavourite: true }),
      ...(archived === "true" && { isArchived: true }),
      ...(archived === "false" && { isArchived: false }),
    };
    const processingWhere = {
      ...where,
      status: { in: ["pending", "processing"] as ProcessingStatus[] },
    };

    const [items, total, processingTotal] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { savedAt: sort === "asc" ? "asc" : "desc" },
        skip,
        take: limitNum,
        include: {
          tags: { include: { tag: true } },
        },
      }),
      prisma.item.count({ where }),
      prisma.item.count({ where: processingWhere }),
    ]);

    res.json({
      data: items.map(mapItemWithTags),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      processingTotal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

/**
 * @route   POST /items
 * @desc    Create a new item via URL
 */
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const {
    url,
    title,
    author,
    podcastName,
    itemType,
    tags,
    collectionId,
    note,
    youtubeTimestamp,
    saveSource,
    isArchived,
  } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let item: any;
  let normalizedUrl: string;
  try {
    await requireOwnedCollection(userId, collectionId);
    normalizedUrl = normalizeSaveUrl(url);
    const normalizedTags = normalizeTagsInput(tags);
    const normalizedItemType = isItemType(itemType) ? itemType : detectItemTypeFromUrl(normalizedUrl);
    const parsedYoutubeTimestamp = parseYoutubeTimestamp(youtubeTimestamp);
    const metadata = normalizeSaveMetadata({ title, author, podcastName, note });
    const normalizedSaveSource: SaveSource =
      saveSource === "extension" || saveSource === "web_url" ? saveSource : "web_url";

    // Initial creation - metadata will be filled by worker later
    item = await prisma.item.create({
      data: {
        userId,
        url: normalizedUrl,
        itemType: normalizedItemType,
        saveSource: normalizedSaveSource,
        title: metadata.title,
        author: metadata.author,
        podcastName: metadata.podcastName,
        userNote: metadata.note,
        youtubeTimestamp: parsedYoutubeTimestamp,
        status: "pending",
        processingStage: "scrape",
        isArchived: Boolean(isArchived),
        // If collection provided
        ...(collectionId && {
          collections: {
            create: { collectionId },
          },
        }),
        // If tags provided manually
        ...(normalizedTags.length > 0 && {
          tags: {
            create: normalizedTags.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId, name: tagName } },
                  create: { userId, name: tagName },
                },
              },
              confidence: 1.0,
            })),
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
      },
    });
    await invalidateGraphCache(userId);

  } catch (error) {
    if (error instanceof OwnershipError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error instanceof SaveValidationError) {
      return res.status(error.status).json({
        error: error.message,
        code: "INVALID_SAVE_REQUEST",
      });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create item" });
    return;
  }

  try {
    await scrapeQueue.add(
      "scrape-url",
      { itemId: item.id, url: normalizedUrl, userId },
      { jobId: buildPipelineJobId("scrape", item.id, item.processingAttempt ?? 0) },
    );
  } catch (error) {
    const message = getQueueFailureMessage(error);
    await markQueueFailure(item.id, message);
    return res.status(503).json({
      error: "Item saved, but processing could not be queued.",
      reason: message,
      item: mapItemWithTags({ ...item, status: "failed", processingStage: "queue", processingError: message }),
      retryable: true,
    });
  }

  return res.status(201).json(mapItemWithTags(item));
});

/**
 * @route   GET /items/:id
 * @desc    Get single item
 */
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        highlights: true,
      },
    });

    if (!item || item.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(mapItemWithTags(item));
  } catch {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

/**
 * @route   PATCH /items/:id
 * @desc    Update item
 */
router.patch("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;
  const { title, description, isFavourite, isArchived, userNote } = req.body;

  try {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        title,
        description,
        isFavourite,
        isArchived,
        userNote,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });
    await invalidateGraphCache(userId);

    res.json(mapItemWithTags(updated));
  } catch {
    res.status(500).json({ error: "Failed to update item" });
  }
});

/**
 * @route   POST /items/:id/archive
 * @desc    Archive an item
 */
router.post("/:id/archive", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: { isArchived: true },
      include: {
        tags: { include: { tag: true } },
      },
    });
    await invalidateGraphCache(userId);

    res.json(mapItemWithTags(updated));
  } catch {
    res.status(500).json({ error: "Failed to archive item" });
  }
});

/**
 * @route   POST /items/:id/unarchive
 * @desc    Unarchive an item
 */
router.post("/:id/unarchive", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: { isArchived: false },
      include: {
        tags: { include: { tag: true } },
      },
    });
    await invalidateGraphCache(userId);

    res.json(mapItemWithTags(updated));
  } catch {
    res.status(500).json({ error: "Failed to unarchive item" });
  }
});

/**
 * @route   DELETE /items/:id
 * @desc    Delete item
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    await prisma.item.delete({ where: { id } });

    // Keep vector index in sync with source-of-truth DB deletes.
    try {
      await deleteEmbedding(id);
    } catch (vectorError) {
      console.warn(`[Items] Item ${id} deleted from DB, but Pinecone cleanup failed`, vectorError);
    }

    // Invalidate cached graph so deleted items disappear immediately from graph view.
    await invalidateGraphCache(userId);

    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

/**
 * @route   GET /items/:id/related
 * @desc    Get related items based on semantic similarity
 */
router.get("/:id/related", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id: itemId } = req.params;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const currentItem = await prisma.item.findUnique({
      where: { id: itemId },
      include: { tags: { include: { tag: true } } },
    });

    if (!currentItem || currentItem.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    const tagFallback = async () => {
      const tagIds = currentItem.tags.map((t) => t.tagId);
      if (tagIds.length === 0) return [];

      const byTags = await prisma.item.findMany({
        where: {
          userId,
          id: { not: itemId },
          isArchived: false,
          tags: {
            some: {
              tagId: { in: tagIds },
            },
          },
        },
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { savedAt: "desc" },
        take: 5,
      });

      return byTags.map(mapItemWithTags);
    };

    // 1. Fetch the item's embedding from Pinecone
    const embedding = await fetchEmbedding(itemId);
    
    if (!embedding) {
      // If no embedding yet, fallback to tag overlap.
      return res.json(await tagFallback());
    }

    // 2. Query Pinecone for top 6 similar items (one might be the item itself)
    const matches = await queryEmbedding(userId, embedding, 6);

    // 3. Filter out the current item itself
    const relatedIds = matches
      .filter(m => m.id !== itemId)
      .slice(0, 5)
      .map(m => m.id);

    if (relatedIds.length === 0) return res.json(await tagFallback());

    // 4. Fetch from PostgreSQL
    const relatedItems = await prisma.item.findMany({
      where: { id: { in: relatedIds }, userId, isArchived: false },
      include: {
        tags: { include: { tag: true } }
      }
    });

    // Sort to maintain Pinecone's relevance order
    const sorted = relatedItems.sort((a, b) => relatedIds.indexOf(a.id) - relatedIds.indexOf(b.id));

    res.json(sorted.map(mapItemWithTags));
  } catch (error: any) {
    console.error(`[Related] Error:`, error.message);
    res.status(500).json({ error: "Failed to fetch related items" });
  }
});

/**
 * @route   POST /items/:id/retry
 * @desc    Retry processing pipeline for a stuck/failed item
 */
router.post("/:id/retry", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });

    if (!item || item.userId !== userId) {
      return res.status(404).json({ error: "Item not found" });
    }

    const hasUsefulScrapeData = Boolean(item.contentText || item.description || (item.title && item.title !== "Untitled"));

    const stage = item.url && !hasUsefulScrapeData ? "scrape" : "ai";
    const nextAttempt = item.processingAttempt + 1;
    const claimed = await prisma.item.updateMany({
      where: {
        id,
        userId,
        processingAttempt: item.processingAttempt,
      },
      data: {
        processingAttempt: { increment: 1 },
        status: stage === "scrape" ? "pending" : "processing",
        processingStage: stage,
        processingError: null,
      },
    });

    if (claimed.count !== 1) {
      return res.status(409).json({ error: "Item is already being retried. Refresh and try again." });
    }

    try {
      if (stage === "scrape" && item.url) {
        await scrapeQueue.add(
          "retry-scrape",
          { itemId: id, url: item.url, userId },
          { jobId: buildPipelineJobId("scrape", id, nextAttempt) },
        );
      } else {
        await aiQueue.add(
          "retry-ai",
          { itemId: id, userId },
          { jobId: buildPipelineJobId("ai", id, nextAttempt) },
        );
      }
    } catch (error) {
      const message = getQueueFailureMessage(error);
      await markQueueFailure(id, message);
      return res.status(503).json({
        error: "Retry could not be queued.",
        reason: message,
        retryable: true,
      });
    }

    const refreshed = await prisma.item.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!refreshed) {
      return res.status(404).json({ error: "Item not found after retry" });
    }

    res.json(mapItemWithTags(refreshed));
  } catch (error: any) {
    console.error(`[Retry] Error:`, error.message);
    res.status(500).json({ error: "Failed to retry item processing" });
  }
});

export default router;
