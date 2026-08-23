import express from "express";
import cors from "cors";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createCorsOptions } from "./cors";

function createTestApp(corsOrigins: string, nodeEnv = "test"): express.Express {
  const app = express();
  app.use(cors(createCorsOptions({ NODE_ENV: nodeEnv, CORS_ORIGINS: corsOrigins })));
  app.post("/v1/items", (_req, res) => res.status(201).json({ ok: true }));
  return app;
}

describe("API CORS transport", () => {
  it("answers browser preflight for a configured web origin", async () => {
    const response = await request(createTestApp("https://app.example.com"))
      .options("/v1/items")
      .set("Origin", "https://app.example.com")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type,x-request-id");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("https://app.example.com");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
    expect(response.headers["access-control-allow-headers"]).toContain("x-request-id");
  });

  it("does not grant browser access to an unconfigured origin", async () => {
    const response = await request(createTestApp("https://app.example.com"))
      .options("/v1/items")
      .set("Origin", "https://attacker.example.com")
      .set("Access-Control-Request-Method", "POST");

    expect(response.status).toBe(500);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("still permits requests from a browser extension origin", async () => {
    const response = await request(createTestApp(""))
      .post("/v1/items")
      .set("Origin", "chrome-extension://extension-id")
      .set("Content-Type", "application/json")
      .send({ title: "saved from extension" });

    expect(response.status).toBe(201);
  });

  it("does not implicitly allow localhost origins in production", async () => {
    const response = await request(createTestApp("", "production"))
      .options("/v1/items")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "POST");

    expect(response.status).toBe(500);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
