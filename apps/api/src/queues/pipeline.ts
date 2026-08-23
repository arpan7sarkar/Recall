import type { JobsOptions } from "bullmq";

const COMPLETED_JOB_RETENTION = {
  age: 24 * 60 * 60,
  count: 1000,
} as const;

const FAILED_JOB_RETENTION = {
  age: 7 * 24 * 60 * 60,
  count: 1000,
} as const;

export type PipelineStage = "scrape" | "ai" | "embed";

/**
 * Keep enough failed jobs to diagnose and retry recent failures without
 * allowing Redis to grow without bound.
 */
export function buildQueueOptions(options: JobsOptions = {}): JobsOptions {
  return {
    ...options,
    removeOnComplete: COMPLETED_JOB_RETENTION,
    removeOnFail: FAILED_JOB_RETENTION,
  };
}

/**
 * A retry must not reuse the id of a retained failed job. The attempt is
 * persisted on the item and is therefore deterministic across API restarts.
 */
export function buildPipelineJobId(stage: PipelineStage, itemId: string, attempt: number): string {
  return `${stage}:${itemId}:${Math.max(0, Math.floor(attempt))}`;
}

export function isFinalAttempt(job: {
  opts?: { attempts?: number };
  attemptsMade?: number;
}): boolean {
  const totalAttempts = Math.max(1, Number(job.opts?.attempts ?? 1));
  const attemptsMade = Math.max(0, Number(job.attemptsMade ?? 0));
  return attemptsMade + 1 >= totalAttempts;
}

export function buildProcessingFailureUpdate(
  job: { opts?: { attempts?: number }; attemptsMade?: number },
  stage: string,
  reason: string,
) {
  return {
    status: isFinalAttempt(job) ? "failed" : "processing",
    processingStage: stage,
    processingError: reason,
  } as const;
}

export function buildReadyUpdate(warning: string | null = null) {
  return {
    status: "ready",
    processingStage: "complete",
    processingError: warning,
  } as const;
}

export function getRedisQueuePolicy(info: string): string | null {
  const match = info.match(/^maxmemory_policy:(.+)$/m);
  return match?.[1]?.trim().toLowerCase() || null;
}

export function assertBullMqRedisPolicy(info: string): void {
  const policy = getRedisQueuePolicy(info);
  if (!policy) {
    throw new Error("Redis maxmemory-policy could not be verified for BullMQ");
  }
  if (policy !== "noeviction") {
    throw new Error(
      `Redis maxmemory-policy must be noeviction for BullMQ (received ${policy})`,
    );
  }
}
