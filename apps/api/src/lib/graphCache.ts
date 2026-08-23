import redis from "./redis";

export const GRAPH_CACHE_TTL_SECONDS = 5 * 60;

export function graphCacheKey(userId: string): string {
  return `graph:${userId}`;
}

export function shouldBypassGraphCache(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((entry) => shouldBypassGraphCache(entry));
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;

  return ["1", "true", "yes", "refresh"].includes(value.trim().toLowerCase());
}

export async function invalidateGraphCache(userId: string): Promise<void> {
  if (!userId) return;
  await redis.del(graphCacheKey(userId)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Graph] Failed to invalidate cache for ${userId}: ${message}`);
  });
}
