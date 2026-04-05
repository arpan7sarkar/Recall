import "module-alias/register";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

import { processScrape } from "./scraperWorker";
import { processAi } from "./aiWorker";
import { processEmbed } from "./embedWorker";

console.log("👷 Starting workers...");

// Scrape Worker
const scrapeWorker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(`[Scrape] Processing job ${job.id} for item ${job.data.itemId}`);
    return processScrape(job);
  },
  { connection, concurrency: 2 }
);

// AI Worker
const aiWorker = new Worker(
  "aiQueue",
  async (job) => {
    console.log(`[AI] Processing job ${job.id} for item ${job.data.itemId}`);
    return processAi(job);
  },
  { connection, concurrency: 2 }
);

// Embed Worker
const embedWorker = new Worker(
  "embedQueue",
  async (job) => {
    console.log(`[Embed] Processing job ${job.id} for item ${job.data.itemId}`);
    return processEmbed(job);
  },
  { connection, concurrency: 2 }
);

// Success handlers
scrapeWorker.on("completed", (job) => console.log(`✅ [Scrape] Job ${job?.id} completed for item ${job?.data?.itemId}`));
aiWorker.on("completed", (job) => console.log(`✅ [AI] Job ${job?.id} completed for item ${job?.data?.itemId}`));
embedWorker.on("completed", (job) => console.log(`✅ [Embed] Job ${job?.id} completed for item ${job?.data?.itemId}`));

// Error handlers
scrapeWorker.on("error", (err) => console.error(`[Scrape] Error:`, err.message));
scrapeWorker.on("failed", (job, err) => console.error(`❌ [Scrape] Job ${job?.id} FAILED for item ${job?.data?.itemId}:`, err.message));

aiWorker.on("error", (err) => console.error(`[AI] Error:`, err.message));
aiWorker.on("failed", (job, err) => console.error(`❌ [AI] Job ${job?.id} FAILED for item ${job?.data?.itemId}:`, err.message));

embedWorker.on("error", (err) => console.error(`[Embed] Error:`, err.message));
embedWorker.on("failed", (job, err) => console.error(`❌ [Embed] Job ${job?.id} FAILED for item ${job?.data?.itemId}:`, err.message));

// Graceful shutdown
const shutdown = async () => {
  console.log("🔻 Shutting down workers...");
  await Promise.all([
    scrapeWorker.close(),
    aiWorker.close(),
    embedWorker.close(),
  ]);
  await connection.quit();
  console.log("🛑 Workers stopped.");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("✅ All workers initialized and listening for jobs");
