import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import prisma from "@/lib/prisma";
import { embedQueue } from "@/queues";
import { buildPipelineJobId, buildProcessingFailureUpdate } from "@/queues/pipeline";
import { invalidateGraphCache } from "../lib/graphCache";
import { fetchRemoteResource } from "../lib/remoteFetch";
import { calculateTextStats } from "./parserStats";

const MAX_EXTRACTED_TEXT_CHARS = 200_000;

async function markReady(itemId: string, warning: string | null = null): Promise<void> {
  await prisma.item.update({
    where: { id: itemId },
    data: {
      status: "ready",
      processingStage: "complete",
      processingError: warning,
    },
  });
}

function parseSuggestedTags(raw: string | null | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const candidates = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as any)?.tags)
        ? (parsed as any).tags
        : [];

    const normalized: string[] = candidates
      .filter((value: unknown): value is string => typeof value === "string")
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0);

    return Array.from(new Set<string>(normalized)).slice(0, 8);
  } catch {
    return [];
  }
}

function buildAiContext(item: {
  title: string | null;
  description: string | null;
  contentText: string | null;
  userNote: string | null;
  itemType: string;
  sourceDomain: string | null;
}) {
  return [
    `TYPE: ${item.itemType || "unknown"}`,
    `SOURCE: ${item.sourceDomain || "unknown"}`,
    `TITLE: ${item.title || "N/A"}`,
    `DESCRIPTION: ${item.description || "N/A"}`,
    `NOTE: ${item.userNote || "N/A"}`,
    `CONTENT SNIPPET (first 2000 chars): ${(item.contentText || "").slice(0, 2000) || "N/A"}`,
  ].join("\n");
}

/**
 * AI Worker handles summary and tag generation
 */
export async function processAi(job: any) {
  const { itemId, userId } = job.data;
  let failureStage = "ai";
  let enrichmentWarning: string | null = null;

  try {
    // 1. Fetch item with existing tags
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { 
        tags: { include: { tag: true } }
      }
    });

    if (!item) throw new Error(`Item ${itemId} not found`);

    await prisma.item.update({
      where: { id: itemId },
      data: { status: "processing", processingStage: "ai", processingError: null },
    });

    let contentToAnalyze = item.contentText || "";
    let suggestedTags: string[] = [];

    // 2. If PDF without content, download and parse
    if (item.itemType === "pdf" && item.fileUrl && !item.contentText) {
      console.log(`[AI] Parsing PDF for item ${itemId}...`);
      try {
        const response = await fetchRemoteResource(item.fileUrl, {
          timeoutMs: Number(process.env.REMOTE_PDF_TIMEOUT_MS ?? 15000),
          maxBytes: Number(process.env.REMOTE_PDF_MAX_BYTES ?? 20 * 1024 * 1024),
          maxRedirects: Number(process.env.REMOTE_MAX_REDIRECTS ?? 3),
          allowedContentTypes: ["application/pdf", "application/octet-stream"],
        });
        if (response.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
          throw new Error("Remote response did not contain a valid PDF signature.");
        }
        const parser = new PDFParse({ data: response.buffer });
        try {
          const data = await parser.getText();
          contentToAnalyze = data.text.slice(0, MAX_EXTRACTED_TEXT_CHARS);
        } finally {
          await parser.destroy();
        }
        
      } catch (err: any) {
        console.error(`[AI] Failed to parse PDF:`, err.message);
        enrichmentWarning = `PDF text extraction was unavailable: ${err.message}`;
      }
    }

    // Keep content synchronized for embedding context.
    const textStats = calculateTextStats(contentToAnalyze);
    if (contentToAnalyze !== item.contentText || item.wordCount !== textStats.wordCount || item.readingTime !== textStats.readingTime) {
      await prisma.item.update({
        where: { id: itemId },
        data: {
          contentText: contentToAnalyze || null,
          readingTime: textStats.readingTime,
          wordCount: textStats.wordCount,
        },
      });
    }

    // 3. Generate tags (best effort). Even if this fails, continue to embedding.
    if (!process.env.OPENAI_API_KEY) {
      console.warn(`[AI] OPENAI_API_KEY missing. Skipping tag generation for ${itemId}.`);
      enrichmentWarning = "AI enrichment was skipped because OPENAI_API_KEY is not configured.";
    } else {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const context = buildAiContext({
          ...item,
          contentText: contentToAnalyze || item.contentText,
        });

        console.log(`[AI] Generating tags for ${itemId}...`);
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a personal research assistant. Suggest 5-8 concise, useful retrieval tags for this content. Return strict JSON object only in this format: {\"tags\":[\"tag1\",\"tag2\"]}.",
            },
            {
              role: "user",
              content: context,
            },
          ],
          response_format: { type: "json_object" },
        });

        suggestedTags = parseSuggestedTags(response.choices[0]?.message?.content);
        console.log(`[AI] Suggested tags for ${itemId}:`, suggestedTags);
      } catch (error: any) {
        console.error(`[AI] Tag generation failed for ${itemId}:`, error.message);
        enrichmentWarning = `AI tag enrichment failed: ${error.message}`;
      }
    }

    // 4. Connect/Create tags in DB
    const existingTagNames = new Set(item.tags.map(t => t.tag.name.toLowerCase()));

    for (const tagName of suggestedTags) {
      const normalized = tagName.toLowerCase().trim();
      if (existingTagNames.has(normalized)) continue;

      try {
        await prisma.itemTag.create({
          data: {
            item: { connect: { id: itemId } },
            tag: {
              connectOrCreate: {
                where: { userId_name: { userId, name: normalized } },
                create: { userId, name: normalized, isAiGenerated: true },
              }
            },
            isAiGenerated: true,
            confidence: 0.9, // Placeholder confidence level
          }
        });
      } catch {
        console.warn(`[AI] Failed to link tag ${normalized} to item ${itemId}`);
      }
    }

    // AI and vectors are optional enrichments. A durable saved item is ready
    // even when provider credentials are unavailable.
    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
      if (!process.env.PINECONE_API_KEY) {
        enrichmentWarning ||= "Vector enrichment was skipped because PINECONE_API_KEY is not configured.";
      }
      await markReady(itemId, enrichmentWarning);
      await invalidateGraphCache(userId);
      return { success: true, tags: suggestedTags, enrichmentSkipped: true };
    }

    // 5. Keep item in processing and hand off to embeddings.
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "processing", processingStage: "embed", processingError: enrichmentWarning },
    });

    failureStage = "queue";
    try {
      await embedQueue.add(
        "process-embed",
        { itemId, userId },
        { jobId: buildPipelineJobId("embed", itemId, item.processingAttempt) },
      );
    } catch (error: any) {
      enrichmentWarning = `Vector enrichment could not be queued: ${error.message}`;
      await markReady(itemId, enrichmentWarning);
    }
    await invalidateGraphCache(userId);

    return { success: true, tags: suggestedTags };
  } catch (error: any) {
    console.error(`[AI] Worker failed for ${itemId}:`, error.message);
    await prisma.item.update({
      where: { id: itemId },
      data: buildProcessingFailureUpdate(
        job,
        failureStage,
        error?.message || "AI processing failed",
      ),
    }).catch(() => null);
    throw error; // Retry
  }
}
