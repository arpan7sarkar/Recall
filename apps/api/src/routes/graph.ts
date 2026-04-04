import { Router, Request, Response } from "express";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { authenticateClerk } from "@/middleware/auth";
import { fetchEmbedding, queryEmbedding } from "@/lib/vectorDB";

const router = Router();

// Apply auth to all graph routes
router.use(authenticateClerk);

/**
 * @route   GET /graph
 * @desc    Build knowledge graph data structure for force-directed visualization
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const CACHE_KEY = `graph:${userId}`;

  try {
    // 1. Check Redis Cache (PRD 4.1.3)
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // 2. Fetch all user items (PRD 4.1.2 step 1)
    const items = await prisma.item.findMany({
      where: { userId, isArchived: false },
      include: {
        tags: { include: { tag: true } },
      },
      orderBy: { savedAt: 'desc' }
    });

    if (items.length === 0) {
      return res.json({ nodes: [], edges: [] });
    }

    // 3. Build nodes array (PRD 4.1.2 step 3)
    const nodes = items.map(item => ({
      id: item.id,
      label: item.title || "Untitled",
      type: item.itemType,
      saveSource: item.saveSource,
      tags: item.tags.map(t => t.tag.name),
      size: 1, // Normalized size, could be weighted by importance or views in future
    }));

    const edges: any[] = [];
    const edgeSet = new Set<string>();

    const addEdge = (source: string, target: string, strength: number, type: string) => {
      // Avoid self-loops
      if (source === target) return;
      
      // Sort IDs to avoid duplicates (A-B and B-A should be the same edge)
      const ids = [source, target].sort();
      const edgeKey = `${ids[0]}-${ids[1]}`;
      
      if (!edgeSet.has(edgeKey)) {
        edges.push({ source, target, strength, type });
        edgeSet.add(edgeKey);
      }
    };

    // 4. Similarity-based edges (PRD 4.1.2 step 2 & 4)
    // To prevent timeout for huge knowledge bases, we limit similarity checking to recent items
    // or we could parallelize more aggressively if needed.
    const similarityItems = items.slice(0, 100); 

    await Promise.all(similarityItems.map(async (item) => {
      try {
        const embedding = await fetchEmbedding(item.id);
        if (embedding) {
          // Top 4 to include itself
          const matches = await queryEmbedding(userId, embedding, 4);
          matches.forEach(match => {
            if (match.id !== item.id && match.score !== undefined && match.score > 0.6) { // Include moderate semantic relationships
               addEdge(item.id, match.id, match.score, 'similarity');
            }
          });
        }
      } catch (e) {
        // Silently skip if no embedding found or query fails
      }
    }));

    // 5. Shared Tag based edges (PRD 4.1.2 step 5)
    const tagToItemMap: Record<string, string[]> = {};
    items.forEach(item => {
      item.tags.forEach(t => {
        const tagName = t.tag.name;
        if (!tagToItemMap[tagName]) tagToItemMap[tagName] = [];
        tagToItemMap[tagName].push(item.id);
      });
    });

    Object.values(tagToItemMap).forEach(itemIds => {
      if (itemIds.length > 1) {
        // Create edges between items sharing the same tag
        // Cap tag-based connections to avoid O(N^2) complexity on generic tags
        const limitedIds = itemIds.slice(0, 30); 
        for (let i = 0; i < limitedIds.length; i++) {
          for (let j = i + 1; j < limitedIds.length; j++) {
            addEdge(limitedIds[i], limitedIds[j], 0.3, 'tag');
          }
        }
      }
    });

    const result = { nodes, edges };

    // 6. Save to Redis Cache for 5 minutes (PRD 4.1.3)
    await redis.set(CACHE_KEY, JSON.stringify(result), "EX", 300);

    res.json(result);
  } catch (error: any) {
    console.error(`[Graph] Error:`, error.message);
    res.status(500).json({ error: "Failed to generate knowledge graph" });
  }
});

export default router;
