import { Queue } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Queue for scraping content from URLs
export const scrapeQueue = new Queue("scrapeQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

// Queue for AI processing (tagging, summary)
export const aiQueue = new Queue("aiQueue", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 10000,
    },
    removeOnComplete: true,
  },
});

// Queue for vector embeddings
export const embedQueue = new Queue("embedQueue", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

export default {
  scrapeQueue,
  aiQueue,
  embedQueue,
};
