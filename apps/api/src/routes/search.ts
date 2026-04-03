import { Router, Request, Response } from "express";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { queryEmbedding } from "@/lib/vectorDB";
import { authenticateClerk } from "@/middleware/auth";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.use(authenticateClerk);

/**
 * Map a Prisma item+tags shape to the frontend ItemTag interface
 */
const mapItem = (item: any) => ({
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
 * @route   GET /search?q=&type=semantic|keyword
 * @desc    Search items by query — semantic (Pinecone) or keyword (ILIKE)
 * @access  Private
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { q, type = "semantic" } = req.query;
  const query = (q as string || "").trim();

  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    // ----- KEYWORD SEARCH -----
    if (type === "keyword") {
      const items = await prisma.item.findMany({
        where: {
          userId,
          isArchived: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { contentText: { contains: query, mode: "insensitive" } },
            {
              tags: {
                some: {
                  tag: { name: { contains: query, mode: "insensitive" } },
                },
              },
            },
          ],
        },
        include: { tags: { include: { tag: true } } },
        orderBy: { savedAt: "desc" },
        take: 20,
      });

      return res.json(items.map(mapItem));
    }

    // ----- SEMANTIC SEARCH -----
    // Check if OpenAI key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[Search] No OpenAI key — falling back to keyword search");
      // Graceful fallback to keyword search
      const items = await prisma.item.findMany({
        where: {
          userId,
          isArchived: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { tags: { include: { tag: true } } },
        orderBy: { savedAt: "desc" },
        take: 20,
      });
      return res.json(items.map(mapItem));
    }

    // 1. Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
    });
    const queryVector = embeddingResponse.data[0].embedding;

    // 2. Query Pinecone
    const pineconeMatches = await queryEmbedding(userId, queryVector, 20);

    if (!pineconeMatches || pineconeMatches.length === 0) {
      return res.json([]);
    }

    // 3. Fetch matched items from PostgreSQL preserving relevance order
    const matchedIds = pineconeMatches.map((m) => m.id);
    const items = await prisma.item.findMany({
      where: {
        id: { in: matchedIds },
        userId,
        isArchived: false,
      },
      include: { tags: { include: { tag: true } } },
    });

    // Preserve Pinecone's relevance order
    const idToScore = new Map(pineconeMatches.map((m) => [m.id, m.score ?? 0]));
    const sorted = items.sort(
      (a, b) => (idToScore.get(b.id) ?? 0) - (idToScore.get(a.id) ?? 0)
    );

    return res.json(sorted.map(mapItem));
  } catch (error: any) {
    console.error("[Search] Error:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
