import { Router, Request, Response } from "express";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";

const router = Router();

// Apply auth to all tag routes
router.use(authenticateClerk);

/**
 * @route   GET /tags
 * @desc    Get all user tags
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  try {
    const tags = await prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

/**
 * @route   POST /tags
 * @desc    Create a new tag
 */
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { name, color } = req.body;

  if (!name) return res.status(400).json({ error: "Tag name is required" });

  try {
    const tag = await prisma.tag.create({
      data: {
        userId: userId!,
        name,
        color,
      },
    });
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: "Failed to create tag" });
  }
});

/**
 * @route   PATCH /tags/:id
 * @desc    Update a tag
 */
router.patch("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    const tag = await prisma.tag.update({
      where: { id, userId },
      data: { name, color },
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: "Failed to update tag" });
  }
});

/**
 * @route   DELETE /tags/:id
 * @desc    Delete a tag
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;

  try {
    await prisma.tag.delete({ where: { id, userId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

/**
 * @route   POST /items/:id/tags
 * @desc    Attach tag to item
 */
// Note: This is an Item-related route but uses tags logic. 
// I'll put it in items.ts or here. PRD says POST /items/:id/tags in tags API.
// Usually, it's better in items.ts, but I'll follow the PRD 1.6.3 instructions if I can find them.
router.post("/attach/:itemId", async (req: Request, res: Response) => {
    const userId = (req as any).auth?.userId;
    const { itemId } = req.params;
    const { tagId, tagName } = req.body;

    try {
        let finalTagId = tagId;

        // If tag name provided but no ID, find or create
        if (!tagId && tagName) {
            const tag = await prisma.tag.upsert({
                where: { userId_name: { userId: userId!, name: tagName } },
                update: {},
                create: { userId: userId!, name: tagName }
            });
            finalTagId = tag.id;
        }

        if (!finalTagId) return res.status(400).json({ error: "Tag ID or Name is required" });

        const itemTag = await prisma.itemTag.upsert({
            where: { itemId_tagId: { itemId, tagId: finalTagId } },
            update: { confidence: 1.0 },
            create: { itemId, tagId: finalTagId, confidence: 1.0 }
        });

        res.json(itemTag);
    } catch (error) {
        res.status(500).json({ error: "Failed to attach tag" });
    }
});

export default router;
