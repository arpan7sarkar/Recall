import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import prisma from "@/lib/prisma";
import { embedQueue } from "@/queues";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 3. Prepare AI prompt
    const context = `
      TITLE: ${item.title}
      DESCRIPTION: ${item.description || "N/A"}
      CONTENT SNIPPET (first 2000 chars): ${contentToAnalyze.slice(0, 2000)}
    `.trim();

    console.log(`[AI] Generating tags for ${itemId}...`);
    
    // 4. Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a personal research assistant. Suggest 5-8 specific, useful tags for this content to help in future retrieval. Return ONLY a JSON array of and strings. Do not include markdown or other text.",
        },
        {
          role: "user",
          content: context,
        },
      ],
      response_format: { type: "json_object" },
    });

    const output = JSON.parse(response.choices[0].message.content || '{"tags": []}');
    const suggestedTags: string[] = Array.isArray(output) ? output : (output.tags || []);

    console.log(`[AI] Suggested tags for ${itemId}:`, suggestedTags);

    // 5. Connect/Create Tags in DB
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

    // 6. Update Status to processing (ready for embedding)
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "processing" },
    });

    // 7. Hand off to Embed Queue
    await embedQueue.add("process-embed", { itemId, userId });

    return { success: true, tags: suggestedTags };
  } catch (error: any) {
    console.error(`[AI] Worker failed for ${itemId}:`, error.message);
    throw error; // Retry
  }
}
