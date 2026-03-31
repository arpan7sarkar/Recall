import { Router, Request, Response } from "express";
import prisma from "@/lib/prisma";
import { authenticateJWT } from "@/middleware/auth";
import { ItemType, SaveSource } from "@prisma/client";

const router = Router();

// Apply auth to all item routes
router.use(authenticateJWT);

/**
 * @route   GET /items
 * @desc    List all items for user
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
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
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
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
  const userId = req.user?.userId;
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

    res.status(201).json(item);
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
  const userId = req.user?.userId;
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

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

/**
 * @route   PATCH /items/:id
 * @desc    Update item
 */
router.patch("/:id", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
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
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

/**
 * @route   DELETE /items/:id
 * @desc    Delete item
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
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
