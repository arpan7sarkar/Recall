import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, currentUser } = vi.hoisted(() => ({
  currentUser: {
    id: "clerk_user_123",
    googleId: null,
    email: "clerk_user_123@clerk.local",
    name: "Clerk User",
    avatarUrl: null,
  },
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    extensionToken: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/middleware/auth", () => ({
  authenticateClerk: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { auth?: unknown }).auth = {
      userId: "clerk_user_123",
      source: "clerk",
    };
    (req as express.Request & { user?: unknown }).user = currentUser;
    next();
  },
}));

import { syncClerkUser } from "./auth";

function makeResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  vi.mocked(response.status).mockReturnValue(response);
  return response;
}

function makeRequest(body: Record<string, unknown>): Request {
  return { body, auth: { userId: "clerk_user_123", source: "clerk" }, user: currentUser } as unknown as Request;
}

describe("POST /auth/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(currentUser, {
      id: "clerk_user_123",
      googleId: null,
      email: "clerk_user_123@clerk.local",
      name: "Clerk User",
      avatarUrl: null,
    });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.update.mockResolvedValue({
      ...currentUser,
      email: "person@example.com",
      name: "Person Example",
    });
    prismaMock.user.upsert.mockResolvedValue({
      ...currentUser,
      email: "person@example.com",
    });
  });

  it("returns a conflict instead of failing when the real email belongs to another account", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "legacy_user_456",
      email: "person@example.com",
      googleId: null,
    });

    const response = makeResponse();
    await syncClerkUser(makeRequest({
      email: "person@example.com",
      name: "Person Example",
    }), response);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      code: "EMAIL_CONFLICT",
      error: "This email is already linked to another account",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.user.upsert).not.toHaveBeenCalled();
  });

  it("updates the legacy local account linked by Clerk identity instead of creating a duplicate", async () => {
    Object.assign(currentUser, {
      id: "legacy_user_456",
      googleId: "clerk_user_123",
      email: "legacy_user_456@clerk.local",
    });

    const response = makeResponse();
    await syncClerkUser(makeRequest({
      email: "person@example.com",
      name: "Person Example",
    }), response);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      user: expect.objectContaining({
        email: "person@example.com",
        name: "Person Example",
      }),
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "legacy_user_456" },
      data: {
        email: "person@example.com",
        name: "Person Example",
        avatarUrl: null,
      },
    });
    expect(prismaMock.user.upsert).not.toHaveBeenCalled();
  });

  it("returns a dependency error when local-user sync cannot write", async () => {
    prismaMock.user.update.mockRejectedValue(new Error("database unavailable"));
    const response = makeResponse();

    await syncClerkUser(makeRequest({ email: "person@example.com" }), response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      error: "Authentication service temporarily unavailable",
    });
  });
});
