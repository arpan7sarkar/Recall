import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateEnvironment } from "./validate-env.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const compose = readFileSync(new URL("../docker-compose.yml", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("../apps/api/src/index.ts", import.meta.url), "utf8");
const corsSource = readFileSync(new URL("../apps/api/src/runtime/cors.ts", import.meta.url), "utf8");
const workerSource = readFileSync(new URL("../apps/api/src/workers/index.ts", import.meta.url), "utf8");

describe("root runtime contract", () => {
  it("orchestrates all application processes and quality commands", () => {
    for (const script of [
      "dev",
      "dev:api",
      "dev:worker",
      "dev:web",
      "build",
      "lint",
      "test",
      "test:e2e",
      "validate:env",
      "check:services",
    ]) {
      assert.equal(typeof packageJson.scripts[script], "string", `missing root script: ${script}`);
    }
  });

  it("keeps Redis on BullMQ's noeviction policy", () => {
    assert.match(compose, /maxmemory-policy.*noeviction/);
  });

  it("exposes separate liveness and readiness endpoints", () => {
    assert.match(apiSource, /app\.get\("\/live"/);
    assert.match(apiSource, /app\.get\("\/ready"/);
    assert.match(corsSource, /localhost:3001/);
    assert.match(workerSource, /requestUrl\.pathname === "\/ready"/);
    assert.match(workerSource, /requestUrl\.pathname === "\/health" \|\| requestUrl\.pathname === "\/live"/);
  });

  it("lets supervisors recover from fatal process errors", () => {
    assert.match(apiSource, /process\.on\("uncaughtException"[\s\S]*process\.exit\(1\)/);
    assert.match(workerSource, /process\.on\("uncaughtException"[\s\S]*process\.exit\(1\)/);
  });

  it("fails clearly when required runtime dependencies are not configured", () => {
    const result = validateEnvironment({}, "all");

    assert.equal(result.code, 1);
    assert.match(result.message, /DATABASE_URL, REDIS_URL/);
  });

  it("accepts the required API and worker contract without printing values", () => {
    const secret = "postgresql://user:secret@db/recall";
    const environment = {
      DATABASE_URL: secret,
      REDIS_URL: "redis://:secret@cache/0",
    };
    const result = validateEnvironment(environment, "all");

    assert.equal(result.code, 0);
    assert.match(result.message, /Environment contract valid/);
    assert.doesNotMatch(result.message, /secret/);
  });
});
