import { describe, expect, it } from "vitest";

import { graphCacheKey, shouldBypassGraphCache } from "./graphCache";

describe("graph cache synchronization", () => {
  it("uses a user-scoped key and supports an explicit resync bypass", () => {
    expect(graphCacheKey("user-1")).toBe("graph:user-1");
    expect(shouldBypassGraphCache("true")).toBe(true);
    expect(shouldBypassGraphCache("1")).toBe(true);
    expect(shouldBypassGraphCache("false")).toBe(false);
  });
});
