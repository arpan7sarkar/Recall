import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";

const router = Router();

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSlug(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function slugBaseFromName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "collection";
}

async function generateUniquePublicSlug(name: string): Promise<string> {
  const base = slugBaseFromName(name);

  for (let i = 0; i < 8; i += 1) {
    const suffix = crypto.randomBytes(3).toString("hex");
    const candidate = `${base}-${suffix}`;
    const existing = await prisma.collection.findUnique({
      where: { publicSlug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function flattenCollectionItems(items: any[]) {
  return items.map((ci: any) => ({
    ...ci.item,
    tags: ci.item.tags?.map((t: any) => ({
      tagId: t.tag.id,
      tagName: t.tag.name,
      tagColor: t.tag.color || null,
      isAiGenerated: t.isAiGenerated || false,
      confidence: t.confidence || 1.0,
    })) || [],
  }));
}

/**
 * @route   GET /collections/public/:slug
 * @desc    Get a shared public collection by slug (no auth)
 */
router.get("/public/:slug", async (req: Request, res: Response) => {
  const slug = normalizeSlug(req.params.slug);
  if (!slug) {
    return res.status(400).json({ error: "Invalid collection slug" });
  }

  try {
    const collection = await prisma.collection.findFirst({
      where: { publicSlug: slug, isPublic: true },
      include: {
        items: {
          where: {
            item: {
              isArchived: false,
            },
          },
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

    if (!collection) {
      return res.status(404).json({ error: "Shared collection not found" });
    }

    const flattenedItems = flattenCollectionItems(collection.items);
    res.json({ ...collection, items: flattenedItems });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shared collection" });
  }
});

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
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedName) {
    return res.status(400).json({ error: "Collection name is required" });
  }

  try {
    const shouldBePublic = Boolean(isPublic);
    const collection = await prisma.collection.create({
      data: {
        userId: userId!,
        name: normalizedName,
        description: normalizeOptionalString(description),
        isPublic: shouldBePublic,
        publicSlug: shouldBePublic ? await generateUniquePublicSlug(normalizedName) : null,
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

    const flattenedItems = flattenCollectionItems(collection.items);

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
  const hasName = name !== undefined;
  const normalizedName = hasName && typeof name === "string" ? name.trim() : null;

  if (hasName && !normalizedName) {
    return res.status(400).json({ error: "Collection name cannot be empty" });
  }

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const updateData: {
      name?: string;
      description?: string | null;
      isPublic?: boolean;
      publicSlug?: string | null;
    } = {};

    if (hasName) {
      updateData.name = normalizedName as string;
    }
    if (description !== undefined) {
      updateData.description = normalizeOptionalString(description) ?? null;
    }
    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
      if (Boolean(isPublic)) {
        if (!existing.publicSlug) {
          const slugSourceName = updateData.name ?? existing.name;
          updateData.publicSlug = await generateUniquePublicSlug(slugSourceName);
        }
      } else {
        // Unsharing invalidates old public links.
        updateData.publicSlug = null;
      }
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: updateData,
    });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

/**
 * @route   POST /collections/:id/share
 * @desc    Enable public sharing for a collection and return share metadata
 */
router.post("/:id/share", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;
  const regenerate = Boolean(req.body?.regenerate);

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const publicSlug =
      regenerate || !existing.publicSlug
        ? await generateUniquePublicSlug(existing.name)
        : existing.publicSlug;

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        isPublic: true,
        publicSlug,
      },
      select: {
        id: true,
        isPublic: true,
        publicSlug: true,
      },
    });

    res.json({
      ...updated,
      sharePath: `/c/${updated.publicSlug}`,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to share collection" });
  }
});

/**
 * @route   POST /collections/:id/unshare
 * @desc    Disable public sharing for a collection
 */
router.post("/:id/unshare", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        isPublic: false,
        publicSlug: null,
      },
      select: {
        id: true,
        isPublic: true,
        publicSlug: true,
      },
    });

    res.json({
      ...updated,
      sharePath: null,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to unshare collection" });
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

  if (typeof itemId !== "string" || itemId.trim().length === 0) {
    return res.status(400).json({ error: "itemId is required" });
  }

  try {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
      select: { id: true },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    await prisma.collectionItem.upsert({
      where: { collectionId_itemId: { collectionId, itemId } },
      update: {},
      create: { collectionId, itemId },
    });

    res.status(200).json({ success: true, collectionId, itemId });
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
  if (!itemId) {
    return res.status(400).json({ error: "itemId is required" });
  }

  try {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.userId !== userId) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
      select: { id: true },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const removed = await prisma.collectionItem.deleteMany({
      where: { collectionId, itemId },
    });

    if (removed.count === 0) {
      return res.status(404).json({ error: "Item not found in collection" });
    }

    res.status(200).json({ success: true, collectionId, itemId });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove item from collection" });
  }
});

export default router;
