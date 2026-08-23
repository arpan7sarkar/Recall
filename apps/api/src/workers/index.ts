import "dotenv/config";
import http from "http";
import { Worker } from "bullmq";
import IORedis from "ioredis";

import { processScrape } from "./scraperWorker";
import { processAi } from "./aiWorker";
import { processEmbed } from "./embedWorker";
import { getRuntimeDiagnostics, getMissingEnvironment } from "../runtime/environment";
import { getWorkerReadiness } from "../runtime/workerReadiness";
import { readinessHttpStatus } from "../runtime/readiness";
import { getWorkerConcurrency } from "./workerConcurrency";

// Minimal health-check server so Render detects an open port
const PORT = parseInt(process.env.PORT || "4001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const missingEnvironment = getMissingEnvironment("worker");

if (missingEnvironment.length > 0) {
  console.error(`[Workers] Missing required environment: ${missingEnvironment.join(", ")}`);
  process.exit(1);
}

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const healthServer = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  res.setHeader("Content-Type", "application/json");

  if (requestUrl.pathname === "/ready") {
    try {
      const readiness = await getWorkerReadiness(() => connection.ping());
      res.writeHead(readinessHttpStatus(readiness));
      res.end(JSON.stringify({
        ...readiness,
        service: "recall-workers",
        timestamp: new Date().toISOString(),
      }));
    } catch {
      res.writeHead(503);
      res.end(JSON.stringify({
        status: "not_ready",
        checks: { runtime: { status: "error" } },
        service: "recall-workers",
        timestamp: new Date().toISOString(),
      }));
    }
    return;
  }

  if (requestUrl.pathname === "/health" || requestUrl.pathname === "/live") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "ok",
      service: "recall-workers",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ status: "not_found" }));
});

connection.on("error", (err) => {
  console.warn("[Workers/Redis] Connection error:", err.message);
});

healthServer.listen(PORT, HOST, () => {
  console.log(`📡 Worker health-check listening on http://${HOST}:${PORT}`);
  console.log("[Workers] Runtime diagnostics", getRuntimeDiagnostics());
});

console.log("👷 Starting workers...");

// ── Workers ──
const scrapeWorker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(`[Scrape] Processing job ${job.id} for item ${job.data.itemId}`);
    return processScrape(job);
  },
  { connection, concurrency: getWorkerConcurrency(process.env.SCRAPER_CONCURRENCY) }
);

const aiWorker = new Worker(
  "aiQueue",
  async (job) => {
    console.log(`[AI] Processing job ${job.id} for item ${job.data.itemId}`);
    return processAi(job);
  },
  { connection, concurrency: getWorkerConcurrency(process.env.AI_CONCURRENCY) }
);

const embedWorker = new Worker(
  "embedQueue",
  async (job) => {
    console.log(`[Embed] Processing job ${job.id} for item ${job.data.itemId}`);
    return processEmbed(job);
  },
  { connection, concurrency: getWorkerConcurrency(process.env.EMBED_CONCURRENCY) }
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
let shuttingDown = false;
const shutdown = async (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Shutting down workers...");
  await Promise.all([
    scrapeWorker.close(),
    aiWorker.close(),
    embedWorker.close(),
  ]);
  await connection.quit();
  healthServer.close();
  console.log("Workers stopped.");
  process.exit(exitCode);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

process.on("unhandledRejection", (reason) => {
  console.error("[Workers] Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("[Workers] Uncaught Exception:", error);
  process.exit(1);
});

console.log("✅ All workers initialized and listening for jobs");
