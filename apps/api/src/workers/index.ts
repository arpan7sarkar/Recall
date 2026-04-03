import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

import { processScrape } from "./scraperWorker";

console.log("👷 Starting workers...");

// Scrape Worker
const scrapeWorker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(`[Scrape] Processing job ${job.id} for item ${job.data.itemId}`);
    return processScrape(job);
  },
  { connection }
);

// AI Worker
const aiWorker = new Worker(
  "aiQueue",
  async (job) => {
    console.log(`[AI] Processing job ${job.id} for item ${job.data.itemId}`);
    // TODO: Implement actual AI processing in Step 3.2
    return { success: true };
  },
  { connection }
);

// Embed Worker
const embedWorker = new Worker(
  "embedQueue",
  async (job) => {
    console.log(`[Embed] Processing job ${job.id} for item ${job.data.itemId}`);
    // TODO: Implement actual embedding in Step 3.2
    return { success: true };
  },
  { connection }
);

// Error handlers
scrapeWorker.on("error", (err) => console.error(`[Scrape] Error:`, err));
scrapeWorker.on("failed", (job, err) => console.error(`[Scrape] Job ${job?.id} failed:`, err));

aiWorker.on("error", (err) => console.error(`[AI] Error:`, err));
aiWorker.on("failed", (job, err) => console.error(`[AI] Job ${job?.id} failed:`, err));

embedWorker.on("error", (err) => console.error(`[Embed] Error:`, err));
embedWorker.on("failed", (job, err) => console.error(`[Embed] Job ${job?.id} failed:`, err));

console.log("✅ All workers initialized");
