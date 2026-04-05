import { Router, Request, Response } from "express";
import type { ItemType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";
import { fetchEmbedding, queryEmbedding } from "@/lib/vectorDB";
import { upload } from "@/middleware/upload";
import { scrapeQueue, aiQueue } from "@/queues";
import { buildKey, uploadFile } from "@/lib/storage";

const router = Router();
const ITEM_TYPES: ItemType[] = ["article", "tweet", "youtube", "pdf", "image", "podcast", "instagram", "linkedin", "link"];

function isItemType(value: unknown): value is ItemType {
  return typeof value === "string" && ITEM_TYPES.includes(value as ItemType);
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

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";

    const host = parsed.hostname.toLowerCase();

    // Remove noisy tracking params for Instagram URLs so the same reel/post dedupes cleanly.
    if (host.includes("instagram.com")) {
      parsed.search = "";
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && ["reel", "p", "tv"].includes(parts[0])) {
        parsed.pathname = `/${parts[0]}/${parts[1]}/`;
      }
    }
    // LinkedIn links are commonly shared with tracking query params.
    if (host.includes("linkedin.com")) {
      parsed.search = "";
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
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
  const { title, itemType, tags, collectionId, note } = req.body;
  const file = req.file;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required for uploads" });
  }

  try {
    const normalizedTags = normalizeTagsInput(tags);
    const inferredType: ItemType =
      isItemType(itemType) ? itemType : file.mimetype.startsWith("image") ? "image" : "pdf";
    const key = buildKey(userId, "files", file.originalname);
    const uploaded = await uploadFile(file.buffer, key, file.mimetype);

    const item = await prisma.item.create({
      data: {
        userId,
        title,
        itemType: inferredType,
        saveSource: "web_upload",
        userNote: note,
        fileUrl: uploaded.url,
        thumbnailUrl: inferredType === "image" ? uploaded.url : null,
        sourceDomain: "upload",
        status: "processing", // No scraping needed, just AI processing
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

    // 3.1.5 Push to aiQueue directly (syncing not needed for files)
    await aiQueue.add("process-upload", { itemId: item.id, userId });

    res.status(201).json(mapItemWithTags(item));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload item metadata" });
  }
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
    },
    take: 10,
  });

  for (const stale of staleItems) {
    const hasUsefulScrapeData = Boolean(
      stale.contentText || stale.description || (stale.title && stale.title !== "Untitled")
    );

    try {
      if (stale.url && !hasUsefulScrapeData) {
        await scrapeQueue.add(
          "retry-stale-scrape",
          { itemId: stale.id, url: stale.url, userId },
          { jobId: `scrape-${stale.id}` }
        );
      } else {
        await aiQueue.add(
          "retry-stale-ai",
          { itemId: stale.id, userId },
          { jobId: `ai-${stale.id}` }
        );
      }
    } catch (error: any) {
      // Ignore duplicate-job errors; another worker/job may already be handling it.
      if (!String(error?.message || "").toLowerCase().includes("job id")) {
        console.warn(`[Items] Failed to requeue stale item ${stale.id}:`, error.message);
      }
    }
  }
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

    const { type, status, favorite, archived, page, limit, sort } = req.query;
    const normalizedType = isItemType(type) ? type : undefined;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      ...(normalizedType && { itemType: normalizedType }),
      ...(status && { status: status as any }),
      ...(favorite === "true" && { isFavourite: true }),
      ...(archived === "true" && { isArchived: true }),
      ...(archived === "false" && { isArchived: false }),
    };

    const [items, total] = await Promise.all([
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
    ]);

    res.json({
      data: items.map(mapItemWithTags),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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
  const { url, itemType, tags, collectionId, note, youtubeTimestamp } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const normalizedUrl = normalizeUrl(url);
    const normalizedTags = normalizeTagsInput(tags);
    const normalizedItemType = isItemType(itemType) ? itemType : detectItemTypeFromUrl(normalizedUrl);
    const parsedYoutubeTimestamp = youtubeTimestamp ? parseInt(String(youtubeTimestamp), 10) : null;

    // Initial creation - metadata will be filled by worker later
    const item = await prisma.item.create({
      data: {
        userId,
        url: normalizedUrl,
        itemType: normalizedItemType,
        saveSource: "web_url", // Default for this endpoint
        userNote: note,
        youtubeTimestamp: Number.isFinite(parsedYoutubeTimestamp) ? parsedYoutubeTimestamp : null,
        status: "pending",
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

    // 3.1.4 Push to scrapeQueue
    await scrapeQueue.add("scrape-url", { itemId: item.id, url: normalizedUrl, userId });

    res.status(201).json(mapItemWithTags(item));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create item" });
  }
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
  } catch (error) {
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

    res.json(mapItemWithTags(updated));
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
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
    res.status(204).send();
  } catch (error) {
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

    if (item.url && !hasUsefulScrapeData) {
      await prisma.item.update({
        where: { id },
        data: { status: "pending" },
      });
      await scrapeQueue.add("retry-scrape", { itemId: id, url: item.url, userId }, { jobId: `scrape-${id}` });
    } else {
      await prisma.item.update({
        where: { id },
        data: { status: "processing" },
      });
      await aiQueue.add("retry-ai", { itemId: id, userId }, { jobId: `ai-${id}` });
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
