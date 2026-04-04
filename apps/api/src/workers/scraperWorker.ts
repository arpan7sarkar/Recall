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

interface TweetFallbackData {
  text: string | null;
  author: string | null;
  thumbnailUrl: string | null;
}

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

function normalizeText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function shorten(value: string, max = 180): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function buildFallbackTitle(url: string, type: string, mainText: string): string {
  if (type === "tweet") {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const username = parts[0] ? `@${parts[0]}` : "tweet";
    if (mainText) return shorten(mainText, 80);
    return `Tweet by ${username}`;
  }

  const parsed = new URL(url);
  const slug = parsed.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[-_]+/g, " ");
  if (slug) return shorten(slug, 80);
  return parsed.hostname;
}

async function fetchTweetFallback(url: string): Promise<TweetFallbackData> {
  try {
    const endpoint = `https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(endpoint, { timeout: 8000 });
    const html = typeof data?.html === "string" ? data.html : "";
    if (!html) return { text: null, author: null, thumbnailUrl: null };

    const $ = cheerio.load(html);
    const tweetText = normalizeText($("blockquote p").first().text());
    const author = typeof data?.author_name === "string" ? data.author_name : null;
    const thumbnailUrl = typeof data?.thumbnail_url === "string" ? data.thumbnail_url : null;

    return {
      text: tweetText || null,
      author,
      thumbnailUrl,
    };
  } catch {
    return { text: null, author: null, thumbnailUrl: null };
  }
}

export async function processScrape(job: any) {
  const { itemId, url, userId } = job.data;

  try {
    // 1. Fetch item from DB
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error(`Item ${itemId} not found`);

    // 2. Set status to processing immediately
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "processing" },
    });

    // 3. Detect type
    const finalType = detectTypeFromUrl(url, item.itemType);

    // 4. Fetch URL content
    let html = "";
    let tweetFallback: TweetFallbackData = { text: null, author: null, thumbnailUrl: null };

    try {
      console.log(`[Scrape] Fetching ${url}...`);
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      });
      html = response.data;
    } catch (error: any) {
      if (finalType !== "tweet") {
        throw error;
      }
      console.warn(`[Scrape] Direct tweet fetch failed for ${itemId}; using oEmbed fallback.`);
    }

    if (finalType === "tweet") {
      tweetFallback = await fetchTweetFallback(url);
    }

    // 4. Extract metadata with metascraper
    const metadata = html ? await metascraper({ html, url }) : {};
    console.log(`[Scrape] Metadata for ${itemId}:`, metadata);

    // 5. Extract main text content with cheerio if readability fails
    let mainText = normalizeText((metadata as any).readability || "");

    if (!mainText && html) {
      const $ = cheerio.load(html);
      mainText = normalizeText(
        $("p")
          .map((_, el) => $(el).text())
          .get()
          .join("\n\n")
          .slice(0, 10000)
      );
    }

    if (!mainText && tweetFallback.text) {
      mainText = tweetFallback.text;
    }

    // 6. Handle thumbnail re-upload to R2
    let thumbnailUrl = item.thumbnailUrl;
    const candidateImage = (metadata as any).image || tweetFallback.thumbnailUrl;
    if (candidateImage && !thumbnailUrl) {
      try {
        const key = buildKey(userId, "thumbnails", `item_${itemId}.jpg`);
        const upload = await uploadFromUrl(candidateImage, key);
        thumbnailUrl = upload.url;
      } catch (err) {
        console.warn(`[Scrape] Failed to upload thumbnail for ${itemId}:`, err);
        // Fallback to original image URL
        thumbnailUrl = candidateImage;
      }
    }

    const title = item.title || (metadata as any).title || buildFallbackTitle(url, finalType, mainText) || "Untitled";
    const description = item.description || (metadata as any).description || (mainText ? shorten(mainText, 240) : null);
    const author = (metadata as any).author || tweetFallback.author || null;
    const publishedAtRaw = (metadata as any).date ? new Date((metadata as any).date) : null;
    const publishedAt = publishedAtRaw && !Number.isNaN(publishedAtRaw.getTime()) ? publishedAtRaw : null;

    // 7. Update DB record
    await prisma.item.update({
      where: { id: itemId },
      data: {
        title,
        description,
        thumbnailUrl: thumbnailUrl,
        contentText: mainText,
        itemType: finalType as any,
        author,
        publishedAt,
        sourceDomain: new URL(url).hostname,
        status: "processing", // Next: AI step
      },
    });

    // 8. Push to AI Queue
    await aiQueue.add("process-ai", { itemId, userId }, { jobId: `ai-${itemId}` });

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
