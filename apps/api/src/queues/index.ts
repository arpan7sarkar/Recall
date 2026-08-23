import { Queue } from "bullmq";
import type { Job, JobType, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

import { assertBullMqRedisPolicy, buildQueueOptions } from "./pipeline";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

let connection: IORedis | null = null;
let redisPolicyCheck: Promise<void> | null = null;

if (REDIS_URL) {
  connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  connection.on("error", (err) => {
    console.warn("[Queues] Redis connection error:", err.message);
  });

  connection.connect().catch((err) => {
    console.warn("[Queues] Redis initial connect failed:", err.message);
  });
} else {
  console.warn("[Queues] REDIS_URL not set - job queues are unavailable");
}

export class QueueUnavailableError extends Error {
  readonly code = "QUEUE_UNAVAILABLE";

  constructor(queueName: string, cause?: unknown) {
    const detail = cause instanceof Error ? ` ${cause.message}` : "";
    super(`Queue "${queueName}" is unavailable. Check the worker and Redis configuration.${detail}`);
    this.name = "QueueUnavailableError";
    if (cause) this.cause = cause;
  }
}

export interface PipelineQueue {
  add(name: string, data: Record<string, unknown>, opts?: JobsOptions): Promise<Job | null>;
  getJobCounts(...types: JobType[]): Promise<Record<string, number>>;
  close(): Promise<void>;
}

async function ensureRedisQueuePolicy(): Promise<void> {
  if (!connection) throw new QueueUnavailableError("redis");
  if (!redisPolicyCheck) {
    redisPolicyCheck = connection
      .info("memory")
      .then((info) => assertBullMqRedisPolicy(info))
      .catch((error) => {
        redisPolicyCheck = null;
        throw error;
      });
  }
  await redisPolicyCheck;
}

function createQueue(name: string, opts: JobsOptions = {}): PipelineQueue {
  if (!connection) {
    return {
      add: async () => {
        throw new QueueUnavailableError(name);
      },
      getJobCounts: async () => {
        throw new QueueUnavailableError(name);
      },
      close: async () => {},
    };
  }

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: buildQueueOptions(opts),
  });

  return {
    add: async (jobName, data, jobOptions) => {
      try {
        await ensureRedisQueuePolicy();
        return await queue.add(jobName, data, buildQueueOptions(jobOptions));
      } catch (error) {
        if (error instanceof QueueUnavailableError) throw error;
        throw new QueueUnavailableError(name, error);
      }
    },
    getJobCounts: async (...types: JobType[]) => {
      try {
        await ensureRedisQueuePolicy();
        return await queue.getJobCounts(...types);
      } catch (error) {
        if (error instanceof QueueUnavailableError) throw error;
        throw new QueueUnavailableError(name, error);
      }
    },
    close: () => queue.close(),
  };
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
