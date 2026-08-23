import prisma from "../lib/prisma";
import redis from "../lib/redis";
import queues from "../queues";
import { checkDependencies, type ReadinessResult } from "./readiness";

function requireEnvironment(name: string): void {
  if (!process.env[name]?.trim()) {
    throw new Error(`${name} is not configured`);
  }
}

async function checkDatabase(): Promise<void> {
  requireEnvironment("DATABASE_URL");
  await prisma.$queryRawUnsafe("SELECT 1");
}

async function checkRedis(): Promise<void> {
  requireEnvironment("REDIS_URL");
  const response = await redis.ping();
  if (response !== "PONG") {
    throw new Error("Redis did not respond with PONG");
  }
}

async function checkQueues(): Promise<void> {
  requireEnvironment("REDIS_URL");
  await Promise.all(
    Object.values(queues).map((queue) => queue.getJobCounts())
  );
}

export function getApiReadiness(): Promise<ReadinessResult> {
  return checkDependencies({
    database: checkDatabase,
    redis: checkRedis,
    queues: checkQueues,
  });
}
