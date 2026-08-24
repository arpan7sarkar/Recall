import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, redisMock, queuesMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findFirst: vi.fn() },
    item: { findFirst: vi.fn() },
    extensionToken: { findFirst: vi.fn() },
  },
  redisMock: { ping: vi.fn() },
  queuesMock: {
    scrapeQueue: { getJobCounts: vi.fn() },
    aiQueue: { getJobCounts: vi.fn() },
    embedQueue: { getJobCounts: vi.fn() },
  },
}));

vi.mock("../lib/prisma", () => ({ default: prismaMock }));
vi.mock("../lib/redis", () => ({ default: redisMock }));
vi.mock("../queues", () => ({ default: queuesMock }));

import { getApiReadiness } from "./apiReadiness";

describe("API readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgresql://configured";
    process.env.REDIS_URL = "redis://configured";
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.item.findFirst.mockResolvedValue(null);
    prismaMock.extensionToken.findFirst.mockResolvedValue(null);
    redisMock.ping.mockResolvedValue("PONG");
    Object.values(queuesMock).forEach((queue) => queue.getJobCounts.mockResolvedValue({}));
  });

  it("checks migrated application tables instead of only database connectivity", async () => {
    const readiness = await getApiReadiness();

    expect(readiness.checks.database).toEqual({ status: "ok" });
    expect(prismaMock.user.findFirst).toHaveBeenCalledOnce();
    expect(prismaMock.item.findFirst).toHaveBeenCalledOnce();
    expect(prismaMock.extensionToken.findFirst).toHaveBeenCalledOnce();
  });

  it("reports the database as not ready when the application schema is missing", async () => {
    prismaMock.user.findFirst.mockRejectedValue(new Error("relation users does not exist"));

    const readiness = await getApiReadiness();

    expect(readiness.status).toBe("not_ready");
    expect(readiness.checks.database).toEqual({ status: "error" });
  });
});
