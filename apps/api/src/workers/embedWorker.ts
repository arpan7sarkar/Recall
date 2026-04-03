import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { upsertEmbedding } from "@/lib/vectorDB";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Embed Worker handles vector generation and indexing in Pinecone
 */
export async function processEmbed(job: any) {
  const { itemId, userId } = job.data;

  try {
    // 1. Fetch item with tags
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        tags: { include: { tag: true } }
      }
    });

    if (!item) throw new Error(`Item ${itemId} not found`);

    // 2. Build text to embed
    // Concatenate title, description, and content snippet for context
    const contentText = item.contentText || "";
    const embeddingText = `${item.title || ""} ${item.description || ""} ${contentText.substring(0, 2000)}`.trim();

    if (!embeddingText) {
      console.warn(`[Embed] No content to embed for item ${itemId}. Skipping vector generation.`);
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "ready" },
      });
      return { success: false, reason: "No content to embed" };
    }

    console.log(`[Embed] Generating vector for item ${itemId} using text-embedding-3-small...`);

    // 3. Call OpenAI for embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: embeddingText,
      encoding_format: "float",
    });

    const vector = response.data[0].embedding;

    // 4. Prepare metadata
    const tagsArray = item.tags?.map(t => t.tag.name) || [];
    const metadata = {
      userId: item.userId,
      itemId: item.id,
      itemType: item.itemType,
      saveSource: item.saveSource,
      tags: tagsArray,
    };

    // 5. Upsert to Pinecone
    console.log(`[Embed] Upserting vector to Pinecone...`);
    await upsertEmbedding(item.id, vector, metadata);

    // 6. Update Item Status as Ready
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "ready" },
    });

    console.log(`[Embed] Successfully indexed item ${itemId} in Pinecone.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Embed] Worker failed for ${itemId}:`, error.message);
    throw error; // Let BullMQ handle retry
  }
}
