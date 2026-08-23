import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthMock, verifyTokenMock, prismaMock } = vi.hoisted(() => {
  process.env.CLERK_SECRET_KEY = "test-secret";
  return {
    getAuthMock: vi.fn(),
    verifyTokenMock: vi.fn(),
    prismaMock: {
      extensionToken: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
        upsert: vi.fn(),
      },
    },
  };
});

vi.mock("@clerk/express", () => ({ getAuth: getAuthMock }));
vi.mock("@clerk/backend", () => ({ verifyToken: verifyTokenMock }));
vi.mock("@/lib/prisma", () => ({ default: prismaMock }));

import { authenticateClerk } from "./auth";

function makeRequest(headers: Record<string, string> = {}): Request {
  return { headers } as Request;
}

function makeResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);
  return response;
}

describe("authenticateClerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthMock.mockReturnValue({ userId: "clerk_user_123" });
    prismaMock.extensionToken.findUnique.mockResolvedValue(null);
    prismaMock.extensionToken.update.mockResolvedValue({});
    prismaMock.user.upsert.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue({
      id: "clerk_user_123",
      email: "person@example.com",
    });
  });

  it("rejects the request when local user lookup fails instead of calling next", async () => {
    prismaMock.user.findFirst.mockRejectedValue(new Error("database unavailable"));
    const response = makeResponse();
    const next = vi.fn<NextFunction>();

    await authenticateClerk(makeRequest(), response, next);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      error: "Authentication service temporarily unavailable",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects the request when Clerk user provisioning fails instead of calling next", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.upsert.mockRejectedValue(new Error("database unavailable"));
    const response = makeResponse();
    const next = vi.fn<NextFunction>();

    await authenticateClerk(makeRequest(), response, next);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      error: "Authentication service temporarily unavailable",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("keeps extension token authentication isolated from Clerk context", async () => {
    getAuthMock.mockReturnValue({ userId: "clerk_user_should_not_be_used" });
    prismaMock.extensionToken.findUnique.mockResolvedValue({
      id: "token_1",
      userId: "extension_user_123",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.user.findFirst.mockResolvedValue({
      id: "extension_user_123",
      email: "extension@example.com",
    });
    const response = makeResponse();
    const next = vi.fn<NextFunction>();
    const request = makeRequest({ authorization: "Bearer recall_ext_valid" });

    await authenticateClerk(request, response, next);

    expect(getAuthMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect((request as Request & { auth?: { userId: string; source: string } }).auth).toEqual({
      userId: "extension_user_123",
      source: "extension_token",
    });
  });

  it("rejects missing bearer credentials without touching the local user store", async () => {
    getAuthMock.mockReturnValue({ userId: null });
    const response = makeResponse();
    const next = vi.fn<NextFunction>();

    await authenticateClerk(makeRequest(), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it("validates a Clerk bearer JWT for cross-origin API requests", async () => {
    getAuthMock.mockReturnValue({ userId: null });
    verifyTokenMock.mockResolvedValue({ sub: "clerk_jwt_user" });
    prismaMock.user.findFirst.mockResolvedValue({
      id: "clerk_jwt_user",
      email: "jwt@example.com",
    });
    const response = makeResponse();
    const next = vi.fn<NextFunction>();

    await authenticateClerk(makeRequest({ authorization: "Bearer header.payload.signature" }), response, next);

    expect(verifyTokenMock).toHaveBeenCalledWith(
      "header.payload.signature",
      expect.objectContaining({ secretKey: "test-secret" }),
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects expired extension tokens", async () => {
    prismaMock.extensionToken.findUnique.mockResolvedValue({
      id: "token_1",
      userId: "extension_user_123",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });
    const response = makeResponse();
    const next = vi.fn<NextFunction>();

    await authenticateClerk(makeRequest({ authorization: "Bearer recall_ext_expired" }), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Token expired. Generate a new one." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns a dependency error when extension-token storage is unavailable", async () => {
    prismaMock.extensionToken.findUnique.mockRejectedValue(new Error("database unavailable"));
    const response = makeResponse();
    const next = vi.fn<NextFunction>();

    await authenticateClerk(makeRequest({ authorization: "Bearer recall_ext_unknown" }), response, next);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      error: "Authentication service temporarily unavailable",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
