import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, redisMock } = vi.hoisted(() => ({
  prismaMock: {
    item: {
      findMany: vi.fn(),
    },
  },
  redisMock: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/redis", () => ({ default: redisMock }));
vi.mock("@/middleware/auth", () => ({
  authenticateClerk: (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { auth?: unknown }).auth = { userId: "user-1" };
    next();
  },
}));
vi.mock("@/lib/vectorDB", () => ({
  fetchEmbedding: vi.fn().mockResolvedValue(null),
  queryEmbedding: vi.fn(),
}));

import graphRoutes from "./graph";

async function invokeGraph(query: Record<string, unknown>) {
  const routeLayer = (graphRoutes as any).stack.find((layer: any) => layer.route?.path === "/");
  const handler = routeLayer.route.stack.at(-1).handle;
  const response = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: undefined as any,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };

  await handler({ query, auth: { userId: "user-1" } }, response);
  return response;
}

describe("GET /graph cache synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.get.mockResolvedValue(JSON.stringify({
      nodes: [{ id: "stale", label: "Stale", type: "article", saveSource: "web_url", tags: [], size: 1 }],
      edges: [],
    }));
    redisMock.set.mockResolvedValue("OK");
    redisMock.del.mockResolvedValue(1);
    prismaMock.item.findMany.mockResolvedValue([
      {
        id: "fresh",
        title: "Fresh",
        itemType: "article",
        saveSource: "web_url",
        tags: [],
      },
    ]);
  });

  it("bypasses the stale Redis snapshot when the dashboard requests a resync", async () => {
    const response = await invokeGraph({ refresh: "1" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-graph-cache"]).toBe("bypass");
    expect(response.body.nodes).toEqual([
      expect.objectContaining({ id: "fresh", label: "Fresh" }),
    ]);
    expect(redisMock.get).not.toHaveBeenCalled();
    expect(prismaMock.item.findMany).toHaveBeenCalledOnce();
  });

  it("serves a valid cached graph for ordinary reads", async () => {
    const response = await invokeGraph({});

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-graph-cache"]).toBe("hit");
    expect(response.body.nodes[0].id).toBe("stale");
    expect(prismaMock.item.findMany).not.toHaveBeenCalled();
  });
});
