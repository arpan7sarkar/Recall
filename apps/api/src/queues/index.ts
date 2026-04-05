import { Queue } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

let connection: IORedis | null = null;

if (REDIS_URL) {
  connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  connection.on("error", (err) => {
    console.warn("[Queues] Redis connection error (non-fatal):", err.message);
  });

  connection.connect().catch((err) => {
    console.warn("[Queues] Redis initial connect failed (will retry):", err.message);
  });
} else {
  console.warn("[Queues] REDIS_URL not set — job queues will be unavailable");
}

const defaultJobOptions = {
  removeOnComplete: true,
};

// Create queues only if Redis is available; otherwise create no-op stubs
function createQueue(name: string, opts: any = {}) {
  if (connection) {
    return new Queue(name, {
      connection,
      defaultJobOptions: { ...defaultJobOptions, ...opts },
    });
  }
  // Return a stub that logs warnings instead of crashing
  return {
    add: async (...args: any[]) => {
      console.warn(`[Queues] Cannot add job to "${name}" — no Redis connection`);
      return null;
    },
    close: async () => {},
  } as unknown as Queue;
}

// Queue for scraping content from URLs
export const scrapeQueue = createQueue("scrapeQueue", {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
});

// Queue for AI processing (tagging, summary)
export const aiQueue = createQueue("aiQueue", {
  attempts: 2,
  backoff: { type: "fixed", delay: 10000 },
});

// Queue for vector embeddings
export const embedQueue = createQueue("embedQueue", {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
});

export default {
  scrapeQueue,
  aiQueue,
  embedQueue,
};
