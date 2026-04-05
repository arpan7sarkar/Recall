import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

let redis: IORedis;

if (REDIS_URL) {
  redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    console.warn("[Redis] Connection error (non-fatal):", err.message);
  });

  // Connect in background — don't block server startup
  redis.connect().catch((err) => {
    console.warn("[Redis] Initial connect failed (will retry):", err.message);
  });
} else {
  console.warn("[Redis] REDIS_URL not set — Redis features will be unavailable");
  // Create a dummy that won't crash callers
  redis = new Proxy({} as IORedis, {
    get(_target, prop) {
      if (prop === "status") return "end";
      if (typeof prop === "string") {
        return (..._args: any[]) => {
          console.warn(`[Redis] Skipping redis.${prop}() — no connection`);
          return Promise.resolve(null);
        };
      }
    },
  });
}

export default redis;
