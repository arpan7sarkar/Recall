import { describe, expect, it } from "vitest";

import {
  checkDependencies,
  readinessHttpStatus,
} from "../src/runtime/readiness";
import {
  getMissingEnvironment,
  getRuntimeDiagnostics,
} from "../src/runtime/environment";
import { getWorkerReadiness } from "../src/runtime/workerReadiness";

describe("runtime readiness", () => {
  it("reports every dependency and returns 503 when one is unavailable", async () => {
    const result = await checkDependencies({
      database: async () => undefined,
      redis: async () => {
        throw new Error("connection refused");
      },
      queues: async () => undefined,
    });

    expect(result).toEqual({
      status: "not_ready",
      checks: {
        database: { status: "ok" },
        redis: { status: "error" },
        queues: { status: "ok" },
      },
    });
    expect(readinessHttpStatus(result)).toBe(503);
  });

  it("returns 200 only when all dependencies are healthy", async () => {
    const result = await checkDependencies({
      database: async () => undefined,
      redis: async () => undefined,
      queues: async () => undefined,
    });

    expect(result.status).toBe("ready");
    expect(readinessHttpStatus(result)).toBe(200);
  });

  it("bounds a dependency check that never resolves", async () => {
    const result = await checkDependencies(
      { redis: () => new Promise(() => undefined) },
      5
    );

    expect(result.status).toBe("not_ready");
    expect(result.checks.redis.status).toBe("error");
  });
});

describe("runtime environment", () => {
  it("requires database and Redis for both API and worker roles", () => {
    expect(getMissingEnvironment("api", {})).toEqual([
      "DATABASE_URL",
      "REDIS_URL",
    ]);
    expect(getMissingEnvironment("worker", { REDIS_URL: "redis://localhost" })).toEqual([]);
  });

  it("reports configured services without exposing secret values", () => {
    const diagnostics = getRuntimeDiagnostics({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:secret@db/app",
      REDIS_URL: "redis://:secret@cache/0",
      CLERK_SECRET_KEY: "secret",
    });

    expect(diagnostics).toEqual({
      nodeEnv: "production",
      configured: {
        database: true,
        redis: true,
        clerk: true,
        cors: false,
        storage: false,
        vector: false,
        ai: false,
      },
    });
    expect(JSON.stringify(diagnostics)).not.toContain("secret");
  });

  it("keeps worker readiness unhealthy until Redis answers PONG", async () => {
    const result = await getWorkerReadiness(async () => "LOADING");

    expect(result.status).toBe("not_ready");
    expect(result.checks.redis.status).toBe("error");
  });
});
