import { describe, expect, it } from "vitest";

import {
  buildPipelineJobId,
  buildProcessingFailureUpdate,
  buildReadyUpdate,
  buildQueueOptions,
  assertBullMqRedisPolicy,
  getRedisQueuePolicy,
  isFinalAttempt,
} from "./pipeline";
import { QueueUnavailableError, scrapeQueue } from "./index";

describe("pipeline queue policy", () => {
  it("fails enqueue explicitly when Redis is not configured", async () => {
    if (process.env.REDIS_URL) return;

    await expect(scrapeQueue.add("scrape-url", { itemId: "item-1", url: "https://example.com", userId: "user-1" }))
      .rejects.toBeInstanceOf(QueueUnavailableError);
  });

  it("exposes a readiness count operation and fails it when Redis is unavailable", async () => {
    if (process.env.REDIS_URL) return;

    await expect(scrapeQueue.getJobCounts()).rejects.toBeInstanceOf(QueueUnavailableError);
  });

  it("retains a bounded failed-job history while cleaning up completed jobs", () => {
    const options = buildQueueOptions({ attempts: 3, backoff: { type: "exponential", delay: 5000 } });

    expect(options.removeOnComplete).toEqual({ age: 24 * 60 * 60, count: 1000 });
    expect(options.removeOnFail).toEqual({ age: 7 * 24 * 60 * 60, count: 1000 });
    expect(options.attempts).toBe(3);
  });

  it("uses a fresh job id for every retry attempt", () => {
    expect(buildPipelineJobId("scrape", "item-1", 1)).not.toBe(
      buildPipelineJobId("scrape", "item-1", 2),
    );
    expect(buildPipelineJobId("scrape", "item-1", 2)).toBe("scrape:item-1:2");
  });

  it("detects the final BullMQ attempt from attemptsMade", () => {
    expect(isFinalAttempt({ opts: { attempts: 3 }, attemptsMade: 0 })).toBe(false);
    expect(isFinalAttempt({ opts: { attempts: 3 }, attemptsMade: 1 })).toBe(false);
    expect(isFinalAttempt({ opts: { attempts: 3 }, attemptsMade: 2 })).toBe(true);
  });

  it("keeps non-final failures retryable and only terminalizes the final attempt", () => {
    expect(buildProcessingFailureUpdate({ opts: { attempts: 3 }, attemptsMade: 1 }, "scrape", "timeout")).toEqual({
      status: "processing",
      processingStage: "scrape",
      processingError: "timeout",
    });
    expect(buildProcessingFailureUpdate({ opts: { attempts: 3 }, attemptsMade: 2 }, "scrape", "timeout")).toEqual({
      status: "failed",
      processingStage: "scrape",
      processingError: "timeout",
    });
  });

  it("represents optional enrichment failure as a ready saved item with a warning", () => {
    expect(buildReadyUpdate("embedding unavailable")).toEqual({
      status: "ready",
      processingStage: "complete",
      processingError: "embedding unavailable",
    });
  });

  it("rejects Redis eviction policies that can evict BullMQ keys", () => {
    expect(getRedisQueuePolicy("# Memory\nmaxmemory_policy:noeviction\n")).toBe("noeviction");
    expect(getRedisQueuePolicy("# Memory\nmaxmemory_policy:volatile-lru\n")).toBe("volatile-lru");
    expect(getRedisQueuePolicy("# Memory\n")).toBeNull();
    expect(() => assertBullMqRedisPolicy("maxmemory_policy:volatile-lru\n")).toThrow(
      "maxmemory-policy must be noeviction",
    );
    expect(() => assertBullMqRedisPolicy("# Memory\n")).toThrow(
      "maxmemory-policy could not be verified",
    );
  });
});
