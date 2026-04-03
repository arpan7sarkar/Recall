import axios from "axios";
import * as cheerio from "cheerio";
import createMetascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperAuthor from "metascraper-author";
import metascraperDate from "metascraper-date";
import metascraperReadability from "metascraper-readability";
import prisma from "@/lib/prisma";
import { uploadFromUrl, buildKey } from "@/lib/storage";
import { aiQueue } from "@/queues";

const metascraper = createMetascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperAuthor(),
  metascraperDate(),
  metascraperReadability(),
]);

/**
 * Detect item type from URL if not already provided
 */
function detectTypeFromUrl(url: string, currentType?: string): string {
  if (currentType && currentType !== "link") return currentType;

  const uri = new URL(url);
  const host = uri.hostname.toLowerCase();
  const path = uri.pathname.toLowerCase();

  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("twitter.com") || host.includes("x.com")) return "tweet";
  if (path.endsWith(".pdf")) return "pdf";
  
  return "article";
}

export async function processScrape(job: any) {
  const { itemId, url, userId } = job.data;

  try {
    // 1. Fetch item from DB
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error(`Item ${itemId} not found`);

    // 2. Detect type
    const finalType = detectTypeFromUrl(url, item.itemType);

    // 3. Fetch URL content
    console.log(`[Scrape] Fetching ${url}...`);
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    // 4. Extract metadata with metascraper
    const metadata = await metascraper({ html, url });
    console.log(`[Scrape] Metadata for ${itemId}:`, metadata);

    // 5. Extract main text content with cheerio if readability fails
    const $ = cheerio.load(html);
    let mainText = metadata.readability || "";
    
    if (!mainText) {
      // Fallback: extract all p tags text
      mainText = $("p")
        .map((_, el) => $(el).text())
        .get()
        .join("\n\n")
        .slice(0, 10000); // Limit size
    }

    // 6. Handle thumbnail re-upload to R2
    let thumbnailUrl = item.thumbnailUrl;
    if (metadata.image && !thumbnailUrl) {
      try {
        const key = buildKey(userId, "thumbnails", `item_${itemId}.jpg`);
        const upload = await uploadFromUrl(metadata.image, key);
        thumbnailUrl = upload.url;
      } catch (err) {
        console.warn(`[Scrape] Failed to upload thumbnail for ${itemId}:`, err);
        // Fallback to original image URL
        thumbnailUrl = metadata.image;
      }
    }

    // 7. Update DB record
    await prisma.item.update({
      where: { id: itemId },
      data: {
        title: item.title || metadata.title || "Untitled",
        description: item.description || metadata.description,
        thumbnailUrl: thumbnailUrl,
        contentText: mainText,
        itemType: finalType as any,
        author: metadata.author,
        publishedAt: metadata.date ? new Date(metadata.date) : null,
        sourceDomain: new URL(url).hostname,
        status: "processing", // Next: AI step
      },
    });

    // 8. Push to AI Queue
    await aiQueue.add("process-ai", { itemId, userId });

    return { success: true };
  } catch (error: any) {
    console.error(`[Scrape] Failed to scrape ${url}:`, error.message);
    
    // Update status to failed
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "failed" },
    }).catch(console.error);

    throw error; // Let BullMQ handle retry
  }
}
