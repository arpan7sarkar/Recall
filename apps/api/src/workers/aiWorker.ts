import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import prisma from "@/lib/prisma";
import { embedQueue } from "@/queues";
import axios from "axios";
import redis from "@/lib/redis";

function isFinalAttempt(job: any): boolean {
  const totalAttempts = Number(job?.opts?.attempts ?? 1);
  return Number(job?.attemptsMade ?? 0) + 1 >= totalAttempts;
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

  try {
    // 1. Fetch item with existing tags
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { 
        tags: { include: { tag: true } }
      }
    });

    if (!item) throw new Error(`Item ${itemId} not found`);

    let contentToAnalyze = item.contentText || "";
    let suggestedTags: string[] = [];

    // 2. If PDF without content, download and parse
    if (item.itemType === "pdf" && item.fileUrl && !item.contentText) {
      console.log(`[AI] Parsing PDF for item ${itemId}...`);
      try {
        const response = await axios.get(item.fileUrl, { responseType: "arraybuffer" });
        const parser = new PDFParse({ data: Buffer.from(response.data) });
        try {
          const data = await parser.getText();
          contentToAnalyze = data.text;
        } finally {
          await parser.destroy();
        }
        
        // Update content in DB for later use
        await prisma.item.update({
          where: { id: itemId },
          data: { contentText: contentToAnalyze },
        });
      } catch (err: any) {
        console.error(`[AI] Failed to parse PDF:`, err.message);
      }
    }

    // Keep content synchronized for embedding context.
    if (contentToAnalyze && contentToAnalyze !== item.contentText) {
      await prisma.item.update({
        where: { id: itemId },
        data: { contentText: contentToAnalyze },
      });
    }

    // 3. Generate tags (best effort). Even if this fails, continue to embedding.
    if (!process.env.OPENAI_API_KEY) {
      console.warn(`[AI] OPENAI_API_KEY missing. Skipping tag generation for ${itemId}.`);
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
      } catch (err) {
        console.warn(`[AI] Failed to link tag ${normalized} to item ${itemId}`);
      }
    }

    // 5. Keep item in processing and hand off to embeddings.
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "processing" },
    });

    await embedQueue.add("process-embed", { itemId, userId }, { jobId: `embed-${itemId}` });
    await redis.del(`graph:${userId}`);

    return { success: true, tags: suggestedTags };
  } catch (error: any) {
    console.error(`[AI] Worker failed for ${itemId}:`, error.message);
    if (isFinalAttempt(job)) {
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "failed" },
      }).catch(() => null);
    }
    throw error; // Retry
  }
}
