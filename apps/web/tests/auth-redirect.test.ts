import { describe, expect, it } from "vitest";
import { getAuthRouteWithRedirect, getSafeAuthRedirect } from "@/lib/auth-redirect";

describe("auth redirects", () => {
  it("preserves an internal protected route", () => {
    const redirect = getSafeAuthRedirect("/dashboard/items/item-123?view=full");

    expect(redirect).toBe("/dashboard/items/item-123?view=full");
    expect(getAuthRouteWithRedirect("/register", redirect)).toBe(
      "/register?redirect=%2Fdashboard%2Fitems%2Fitem-123%3Fview%3Dfull",
    );
  });

  it("falls back to dashboard for external or malformed destinations", () => {
    expect(getSafeAuthRedirect("https://evil.example/phish")).toBe("/dashboard");
    expect(getSafeAuthRedirect("//evil.example/phish")).toBe("/dashboard");
    expect(getSafeAuthRedirect("/\\\\evil.example/phish")).toBe("/dashboard");
    expect(getSafeAuthRedirect(undefined)).toBe("/dashboard");
  });
});
