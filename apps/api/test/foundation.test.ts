import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packagePath = resolve(process.cwd(), "package.json");

describe("API test foundation", () => {
  it("declares an executable Vitest test command", async () => {
    const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as {
      scripts?: { test?: string };
    };

    expect(packageJson.scripts?.test).toBe("vitest run");
  });

  it("keeps the Prisma schema in the API package", async () => {
    const schema = await readFile(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

    expect(schema).toContain("model Item");
    expect(schema).toContain("enum ProcessingStatus");
    expect(schema).toContain("processingStage");
    expect(schema).toContain("processingError");
    expect(schema).toContain("processingAttempt");
  });
});
