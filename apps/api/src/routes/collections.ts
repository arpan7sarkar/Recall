import { Router, Request, Response } from "express";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";

const router = Router();

// Apply auth to all collection routes
router.use(authenticateClerk);

/**
 * @route   GET /collections
 * @desc    Get all user collections
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  try {
    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

/**
 * @route   POST /collections
 * @desc    Create a new collection
 */
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { name, description, isPublic } = req.body;

  if (!name) return res.status(400).json({ error: "Collection name is required" });

  try {
    const collection = await prisma.collection.create({
      data: {
        userId: userId!,
        name,
        description,
        isPublic: isPublic || false,
      },
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: "Failed to create collection" });
  }
});

/**
 * @route   GET /collections/:id
 * @desc    Get single collection with its items
 */
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: {
              include: {
                tags: { include: { tag: true } },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!collection || collection.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // Flatten logic for items
    const flattenedItems = collection.items.map((ci: any) => ({
      ...ci.item,
      tags: ci.item.tags?.map((t: any) => ({
        tagId: t.tag.id,
        tagName: t.tag.name,
        tagColor: t.tag.color || null,
        isAiGenerated: t.isAiGenerated || false,
        confidence: t.confidence || 1.0,
      })) || [],
    }));

    res.json({ ...collection, items: flattenedItems });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

/**
 * @route   PATCH /collections/:id
 * @desc    Update a collection
 */
router.patch("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;
  const { name, description, isPublic } = req.body;

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: { name, description, isPublic },
    });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

/**
 * @route   DELETE /collections/:id
 * @desc    Delete a collection
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    await prisma.collection.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

/**
 * @route   POST /collections/:id/items
 * @desc    Add item to collection
 */
router.post("/:id/items", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id: collectionId } = req.params;
  const { itemId } = req.body;

  try {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    await prisma.collectionItem.upsert({
      where: { collectionId_itemId: { collectionId, itemId } },
      update: {},
      create: { collectionId, itemId },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to add item to collection" });
  }
});

/**
 * @route   DELETE /collections/:id/items/:itemId
 * @desc    Remove item from collection
 */
router.delete("/:id/items/:itemId", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id: collectionId, itemId } = req.params;

  try {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    await prisma.collectionItem.delete({
      where: { collectionId_itemId: { collectionId, itemId } }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to remove item from collection" });
  }
});

export default router;
