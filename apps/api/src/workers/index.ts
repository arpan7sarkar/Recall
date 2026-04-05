import "module-alias/register";
import "dotenv/config";
import http from "http";
import { Worker } from "bullmq";
import IORedis from "ioredis";

import { processScrape } from "./scraperWorker";
import { processAi } from "./aiWorker";
import { processEmbed } from "./embedWorker";

// ── Minimal health-check server so Render detects an open port ──
const PORT = parseInt(process.env.PORT || "4001", 10);
const HOST = process.env.HOST || "0.0.0.0";

const healthServer = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    status: "ok",
    service: "recall-workers",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));
});

healthServer.listen(PORT, HOST, () => {
  console.log(`📡 Worker health-check listening on http://${HOST}:${PORT}`);
});

// ── Redis connection ──
const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => {
  console.warn("[Workers/Redis] Connection error:", err.message);
});

console.log("👷 Starting workers...");

// ── Workers ──
const scrapeWorker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(`[Scrape] Processing job ${job.id} for item ${job.data.itemId}`);
    return processScrape(job);
  },
  { connection, concurrency: 2 }
);

const aiWorker = new Worker(
  "aiQueue",
  async (job) => {
    console.log(`[AI] Processing job ${job.id} for item ${job.data.itemId}`);
    return processAi(job);
  },
  { connection, concurrency: 2 }
);

const embedWorker = new Worker(
  "embedQueue",
  async (job) => {
    console.log(`[Embed] Processing job ${job.id} for item ${job.data.itemId}`);
    return processEmbed(job);
  },
  { connection, concurrency: 2 }
);

// ── Success handlers ──
scrapeWorker.on("completed", (job) => console.log(`✅ [Scrape] Job ${job?.id} completed for item ${job?.data?.itemId}`));
aiWorker.on("completed", (job) => console.log(`✅ [AI] Job ${job?.id} completed for item ${job?.data?.itemId}`));
embedWorker.on("completed", (job) => console.log(`✅ [Embed] Job ${job?.id} completed for item ${job?.data?.itemId}`));

// ── Error handlers ──
scrapeWorker.on("error", (err) => console.error(`[Scrape] Error:`, err.message));
scrapeWorker.on("failed", (job, err) => console.error(`❌ [Scrape] Job ${job?.id} FAILED for item ${job?.data?.itemId}:`, err.message));

aiWorker.on("error", (err) => console.error(`[AI] Error:`, err.message));
aiWorker.on("failed", (job, err) => console.error(`❌ [AI] Job ${job?.id} FAILED for item ${job?.data?.itemId}:`, err.message));

embedWorker.on("error", (err) => console.error(`[Embed] Error:`, err.message));
embedWorker.on("failed", (job, err) => console.error(`❌ [Embed] Job ${job?.id} FAILED for item ${job?.data?.itemId}:`, err.message));

// ── Graceful shutdown ──
const shutdown = async () => {
  console.log("🔻 Shutting down workers...");
  await Promise.all([
    scrapeWorker.close(),
    aiWorker.close(),
    embedWorker.close(),
  ]);
  await connection.quit();
  healthServer.close();
  console.log("🛑 Workers stopped.");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("unhandledRejection", (reason) => {
  console.error("[Workers] Unhandled Rejection:", reason);
});

console.log("✅ All workers initialized and listening for jobs");
