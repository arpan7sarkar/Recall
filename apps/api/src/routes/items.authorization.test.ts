import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, queueMock, storageMock, currentItem } = vi.hoisted(() => ({
  prismaMock: {
    item: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    collection: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    itemTag: {
      upsert: vi.fn(),
    },
    tag: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
  queueMock: {
    scrapeQueue: { add: vi.fn() },
    aiQueue: { add: vi.fn() },
  },
  storageMock: {
    buildKey: vi.fn().mockReturnValue("uploads/user-1/file.pdf"),
    deleteFile: vi.fn(),
    uploadFile: vi.fn().mockResolvedValue({
      key: "uploads/user-1/file.pdf",
      url: "https://storage.example/file.pdf",
    }),
  },
  currentItem: {
    id: "item-owner-1",
    userId: "user-1",
    url: "https://example.com/article",
    itemType: "article",
    saveSource: "web_url",
    status: "pending",
    tags: [],
  },
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/middleware/auth", () => ({
  authenticateClerk: (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { auth?: unknown }).auth = { userId: "user-1" };
    next();
  },
}));
vi.mock("@/lib/vectorDB", () => ({
  deleteEmbedding: vi.fn(),
  fetchEmbedding: vi.fn(),
  queryEmbedding: vi.fn(),
}));
vi.mock("@/lib/graphCache", () => ({ invalidateGraphCache: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/storage", () => storageMock);
vi.mock("@/middleware/upload", () => ({
  upload: {
    single: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  },
}));
vi.mock("@/middleware/uploadContract", () => ({
  UploadValidationError: class UploadValidationError extends Error {},
  validateUploadBuffer: vi.fn(),
}));
vi.mock("@/queues", () => queueMock);
vi.mock("@/queues/pipeline", () => ({ buildPipelineJobId: vi.fn().mockReturnValue("scrape-job") }));

import itemRoutes from "./items";
import collectionRoutes from "./collections";
import tagRoutes from "./tags";

function makeResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    send(body?: unknown) {
      this.body = body;
      return this;
    },
  };
  return response;
}

function findHandler(router: any, method: string, path: string) {
  const layer = router.stack.find((entry: any) => entry.route?.path === path && entry.route.methods[method]);
  if (!layer) throw new Error(`Missing ${method.toUpperCase()} ${path} route`);
  return layer.route.stack.at(-1).handle;
}

async function invoke(router: any, method: string, path: string, request: Partial<Request>) {
  const response = makeResponse();
  const handler = findHandler(router, method, path);
  await handler({ ...request, auth: { userId: "user-1" } }, response);
  return response;
}

describe("cross-user nested relation boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentItem.tags = [];
    prismaMock.item.create.mockResolvedValue(currentItem);
    prismaMock.item.findFirst.mockResolvedValue(currentItem);
    prismaMock.collection.findFirst.mockResolvedValue(null);
    prismaMock.collection.findUnique.mockResolvedValue(null);
    prismaMock.tag.findFirst.mockResolvedValue(null);
    queueMock.scrapeQueue.add.mockResolvedValue({ id: "scrape-job" });
    queueMock.aiQueue.add.mockResolvedValue({ id: "ai-job" });
  });

  it("rejects a URL save that names another user's collection before persistence", async () => {
    const response = await invoke(itemRoutes, "post", "/", {
      body: {
        url: "https://example.com/article",
        collectionId: "collection-owned-by-user-2",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: "Collection not found" });
    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "collection-owned-by-user-2", userId: "user-1" },
      select: { id: true },
    });
    expect(prismaMock.item.create).not.toHaveBeenCalled();
  });

  it("rejects a file save that names another user's collection before uploading", async () => {
    const response = await invoke(itemRoutes, "post", "/upload", {
      body: {
        title: "Uploaded document",
        collectionId: "collection-owned-by-user-2",
      },
      file: {
        buffer: Buffer.from("%PDF-1.7"),
        mimetype: "application/pdf",
        originalname: "document.pdf",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: "Collection not found" });
    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "collection-owned-by-user-2", userId: "user-1" },
      select: { id: true },
    });
    expect(storageMock.uploadFile).not.toHaveBeenCalled();
    expect(prismaMock.item.create).not.toHaveBeenCalled();
  });

  it("rejects a tag attachment when the tag belongs to another user", async () => {
    prismaMock.item.findFirst.mockResolvedValue(currentItem);
    prismaMock.tag.findFirst.mockResolvedValue(null);

    const response = await invoke(tagRoutes, "post", "/attach/:itemId", {
      params: { itemId: currentItem.id },
      body: { tagId: "tag-owned-by-user-2" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: "Tag not found" });
    expect(prismaMock.itemTag.upsert).not.toHaveBeenCalled();
  });

  it("does not expose a foreign user's item through a public collection relation", async () => {
    prismaMock.collection.findFirst.mockResolvedValue({
      id: "collection-1",
      userId: "user-1",
      publicSlug: "shared",
      isPublic: true,
      items: [
        { item: { id: "item-owner-1", userId: "user-1", isArchived: false, tags: [] } },
        { item: { id: "item-owner-2", userId: "user-2", isArchived: false, tags: [] } },
      ],
    });

    const response = await invoke(collectionRoutes, "get", "/public/:slug", {
      params: { slug: "shared" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual(["item-owner-1"]);
  });
});
