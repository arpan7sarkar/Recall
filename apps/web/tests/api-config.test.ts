import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveApiBase } from "@/lib/api";

describe("API base configuration", () => {
  it("fails closed when a deployed web app has no production API base", async () => {
    expect(() => resolveApiBase({ hostname: "recall.example.com" }, {
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: undefined,
      NEXT_PUBLIC_API_URL_PROD: undefined,
      NEXT_PUBLIC_RENDER_API_URL: undefined,
    })).toThrow(
      /production API base is not configured/i,
    );
  });

  it("keeps local development on the documented local API", async () => {
    expect(resolveApiBase({ hostname: "localhost" }, {
      NODE_ENV: "development",
      NEXT_PUBLIC_API_URL: undefined,
      NEXT_PUBLIC_API_URL_DEV: undefined,
    })).toBe("http://localhost:4000/v1");
  });

  it("uses the explicit production API base for deployed hosts", async () => {
    expect(resolveApiBase({ hostname: "recall.example.com" }, {
      NODE_ENV: "production",
      NEXT_PUBLIC_RENDER_API_URL: "https://api.example.com/v1",
    })).toBe("https://api.example.com/v1");
  });

  it("keeps public environment reads statically analyzable for Next.js", () => {
    const apiSource = readFileSync(
      resolve(process.cwd(), "lib/api.ts"),
      "utf8",
    );

    expect(apiSource).toContain(
      "NEXT_PUBLIC_RENDER_API_URL: process.env.NEXT_PUBLIC_RENDER_API_URL",
    );
    expect(apiSource).not.toContain(
      "environment: ApiEnvironment = process.env",
    );
  });
});
