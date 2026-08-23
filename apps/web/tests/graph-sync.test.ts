import { describe, expect, it } from "vitest";

import { graphRequestPath } from "@/hooks/useGraphData";

describe("dashboard graph synchronization", () => {
  it("uses the cache by default and explicitly bypasses it for resync", () => {
    expect(graphRequestPath(false)).toBe("/graph");
    expect(graphRequestPath(true)).toBe("/graph?refresh=1");
  });
});
