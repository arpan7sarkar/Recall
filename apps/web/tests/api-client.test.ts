import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError, classifyApiError, getApiErrorMessage, resolveApiBase } from "@/lib/api";

afterEach(() => vi.restoreAllMocks());

describe("API client transport", () => {
  it("classifies authentication and dependency failures", () => {
    expect(classifyApiError(new ApiError(401, "Unauthorized", { error: "Sign in again" }))).toBe("auth");
    expect(classifyApiError(new ApiError(422, "Unprocessable Entity", { error: "Invalid URL" }))).toBe("validation");
    expect(classifyApiError(new ApiError(503, "Unavailable", { error: "Redis unavailable" }))).toBe("dependency");
    expect(getApiErrorMessage(new ApiError(409, "Conflict", { error: "Already saved" }))).toBe("Already saved");
  });

  it("adds a request correlation ID and handles empty success responses", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 200 }));
    await expect(apiFetch("/items", { method: "DELETE" })).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual(expect.objectContaining({ "X-Request-ID": expect.any(String) }));
  });

  it("turns network failures into offline transport errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    await expect(apiFetch("/items")).rejects.toMatchObject({ kind: "offline" });
  });

  it("rejects unauthorized responses as structured API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, statusText: "Unauthorized" }));
    await expect(apiFetch("/items")).rejects.toMatchObject({ status: 401, body: { error: "Unauthorized" } });
  });

  it("uses the configured production endpoint when a deployed app would otherwise call localhost", () => {
    expect(resolveApiBase({ hostname: "recall.example.com" })).not.toContain("localhost");
  });
});
