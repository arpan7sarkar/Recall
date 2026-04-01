import { Router, Request, Response } from "express";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";
// Types should come from @prisma/client, but defining locally to fix generation/lint issues
export type ItemType = "article" | "tweet" | "youtube" | "pdf" | "image" | "podcast" | "link";
export type SaveSource = "extension" | "web_url" | "web_upload";

import { upload } from "@/middleware/upload";

const router = Router();

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

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required for uploads" });
  }

  try {
    // Note: Actual storage to R2 would happen here or in a worker. 
    // Following PRD Data Flow C, it's done synchronously in the API or in worker.
    // For now, we'll store metadata and indicate processing.
    
    const item = await prisma.item.create({
      data: {
        userId: userId!,
        title,
        itemType: (itemType as ItemType) || (file.mimetype.startsWith("image") ? "image" : "pdf"),
        saveSource: "web_upload",
        userNote: note,
        status: "processing", // No scraping needed, just AI processing
        // If collection provided
        ...(collectionId && {
          collections: {
            create: { collectionId },
          },
        }),
        // If tags provided manually
        ...(tags && tags.length > 0 && {
          tags: {
            create: (Array.isArray(tags) ? tags : [tags]).map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId: userId!, name: tagName } },
                  create: { userId: userId!, name: tagName },
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

/**
 * @route   GET /items
 * @desc    List all items for user
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { type, status, favorite, archived, page, limit, sort } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      ...(type && { itemType: type as ItemType }),
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

  if (!url && !itemType) {
    return res.status(400).json({ error: "URL or Item type is required" });
  }

  try {
    // Initial creation - metadata will be filled by worker later
    const item = await prisma.item.create({
      data: {
        userId: userId!,
        url,
        itemType: (itemType as ItemType) || "link",
        saveSource: "web_url", // Default for this endpoint
        userNote: note,
        youtubeTimestamp: youtubeTimestamp ? parseInt(youtubeTimestamp) : null,
        status: "pending",
        // If collection provided
        ...(collectionId && {
          collections: {
            create: { collectionId },
          },
        }),
        // If tags provided manually
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId: userId!, name: tagName } },
                  create: { userId: userId!, name: tagName },
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

export default router;
