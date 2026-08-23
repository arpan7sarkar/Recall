import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const prismaRoot = resolve(process.cwd(), "prisma");
const migrationsRoot = resolve(prismaRoot, "migrations");

async function migrationSql(name: string): Promise<string> {
  return readFile(resolve(migrationsRoot, name, "migration.sql"), "utf8");
}

describe("Prisma migration history", () => {
  it("contains a complete, ordered migration directory with the PostgreSQL lock", async () => {
    const entries = await readdir(migrationsRoot, { withFileTypes: true });
    const migrationNames = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(migrationNames).toEqual(expect.arrayContaining([
      "20260405162000_baseline",
      "20260406031554_add_extension_tokens",
      "20260824013000_pipeline_recovery",
      "20260824020000_save_metadata_contract",
    ]));
    expect(migrationNames).toEqual([...migrationNames].sort());

    for (const name of migrationNames) {
      await expect(readFile(resolve(migrationsRoot, name, "migration.sql"), "utf8")).resolves.toMatch(/\S/);
    }

    await expect(readFile(resolve(migrationsRoot, "migration_lock.toml"), "utf8"))
      .resolves.toContain('provider = "postgresql"');
  });

  it("keeps extension-token tables and ownership constraints in the migration history", async () => {
    const baseline = await migrationSql("20260405162000_baseline");
    const extensionTokens = await migrationSql("20260406031554_add_extension_tokens");

    expect(baseline).toContain('CREATE TABLE "users"');
    expect(extensionTokens).toContain('CREATE TABLE "extension_tokens"');
    expect(extensionTokens).toContain('"token_hash" TEXT NOT NULL');
    expect(extensionTokens).toContain('CREATE UNIQUE INDEX "extension_tokens_token_hash_key"');
    expect(extensionTokens).toContain('REFERENCES "users"("id") ON DELETE CASCADE');
  });

  it("has migration entries for every post-baseline item field in the current schema", async () => {
    const schema = await readFile(resolve(prismaRoot, "schema.prisma"), "utf8");
    const pipeline = await migrationSql("20260824013000_pipeline_recovery");
    const metadata = await migrationSql("20260824020000_save_metadata_contract");

    expect(schema).toMatch(/processingStage\s+String\?/);
    expect(schema).toMatch(/processingError\s+String\?/);
    expect(schema).toMatch(/processingAttempt\s+Int\s+@default\(0\)/);
    expect(schema).toMatch(/podcastName\s+String\?/);
    expect(pipeline).toContain('ADD COLUMN "processing_stage" TEXT');
    expect(pipeline).toContain('ADD COLUMN "processing_error" TEXT');
    expect(pipeline).toContain('ADD COLUMN "processing_attempt" INTEGER NOT NULL DEFAULT 0');
    expect(metadata).toContain('ADD COLUMN "podcast_name" TEXT');
  });
});
