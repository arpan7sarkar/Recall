const MAX_WORKER_CONCURRENCY = 4;

export function getWorkerConcurrency(value: string | undefined, fallback = 2): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_WORKER_CONCURRENCY);
}
