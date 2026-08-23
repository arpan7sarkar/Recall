import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { upsertEmbedding } from "@/lib/vectorDB";
import { buildProcessingFailureUpdate } from "@/queues/pipeline";
import { invalidateGraphCache } from "../lib/graphCache";

/**
 * Embed Worker handles vector generation and indexing in Pinecone
 */
export async function processEmbed(job: any) {
  const { itemId } = job.data;

  try {
    // 1. Fetch item with tags
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        tags: { include: { tag: true } }
      }
    });

    if (!item) throw new Error(`Item ${itemId} not found`);

    await prisma.item.update({
      where: { id: itemId },
      data: { status: "processing", processingStage: "embed" },
    });

    // 2. Build text to embed (with robust fallbacks)
    const embeddingText = [
      item.title,
      item.description,
      item.contentText?.substring(0, 2000),
      item.userNote,
      item.author,
      item.url,
      item.sourceDomain,
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join("\n\n")
      .trim();

    if (!embeddingText) {
      console.warn(`[Embed] No content to embed for item ${itemId}. Skipping vector generation.`);
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "ready", processingStage: "complete" },
      });
      return { success: false, reason: "No content to embed" };
    }

    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
      const missing = [
        !process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" : null,
        !process.env.PINECONE_API_KEY ? "PINECONE_API_KEY" : null,
      ].filter(Boolean).join(", ");
      const warning = `Vector enrichment was skipped because ${missing} is not configured.`;
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "ready", processingStage: "complete", processingError: warning },
      });
      return { success: false, reason: warning };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`[Embed] Generating vector for item ${itemId} using text-embedding-3-small (1024d)...`);

    // 3. Call OpenAI for embedding
    // IMPORTANT: dimensions must match the Pinecone index dimension (1024)
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: embeddingText,
      dimensions: 1024,
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
    console.log(`[Embed] Upserting vector (${vector.length}d) to Pinecone...`);
    await upsertEmbedding(item.id, vector, metadata);

    // 6. Update Item Status as Ready
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "ready", processingStage: "complete" },
    });
    await invalidateGraphCache(item.userId);

    console.log(`[Embed] Successfully indexed item ${itemId} in Pinecone.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Embed] Worker failed for ${itemId}:`, error.message);
    if (buildProcessingFailureUpdate(job, "embed", error.message).status === "failed") {
      await prisma.item.update({
        where: { id: itemId },
        data: {
          status: "ready",
          processingStage: "complete",
          processingError: `Vector enrichment failed after retries: ${error.message}`,
        },
      }).catch(() => null);
      return { success: false, reason: error.message, enrichmentSkipped: true };
    }
    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: "processing",
        processingStage: "embed",
        processingError: error?.message || "Embedding failed; retrying",
      },
    }).catch(() => null);
    throw error;
  }
}
