import { afterEach, describe, expect, it, vi } from "vitest";

import { loadTwitterWidgets } from "@/lib/twitterWidgets";

describe("Twitter widget loading", () => {
  afterEach(() => {
    delete (window as Window & { twttr?: unknown }).twttr;
  });

  it("does nothing before the shared runtime is ready", () => {
    expect(loadTwitterWidgets()).toBe(false);
  });

  it("loads only the mounted blockquote when the runtime is ready", () => {
    const load = vi.fn();
    Object.defineProperty(window, "twttr", {
      configurable: true,
      value: { widgets: { load } },
    });
    const container = document.createElement("div");

    expect(loadTwitterWidgets(container)).toBe(true);
    expect(load).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledWith(container);
  });
});
