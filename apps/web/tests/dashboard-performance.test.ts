import { describe, expect, it } from "vitest";

import {
  getGraphRenderPolicy,
  getItemProcessingPollInterval,
  shouldLoadThirdPartyEmbed,
} from "@/lib/dashboardPerformance";

describe("dashboard performance policies", () => {
  it("keeps item processing polling bounded to the active recovery window", () => {
    expect(
      getItemProcessingPollInterval({
        hasPendingProcessing: true,
        pollingStartedAt: 1_000,
        now: 60_999,
      }),
    ).toBe(5_000);
    expect(
      getItemProcessingPollInterval({
        hasPendingProcessing: true,
        pollingStartedAt: 1_000,
        now: 61_000,
      }),
    ).toBe(false);
    expect(
      getItemProcessingPollInterval({
        hasPendingProcessing: false,
        pollingStartedAt: null,
        now: 1_000,
      }),
    ).toBe(false);
  });

  it("turns off graph particle animation when hidden, reduced-motion, or large", () => {
    expect(
      getGraphRenderPolicy({
        nodeCount: 12,
        isVisible: true,
        isDocumentVisible: true,
        prefersReducedMotion: false,
      }).directionalParticles,
    ).toBe(1);
    expect(
      getGraphRenderPolicy({
        nodeCount: 12,
        isVisible: false,
        isDocumentVisible: true,
        prefersReducedMotion: false,
      }).directionalParticles,
    ).toBe(0);
    expect(
      getGraphRenderPolicy({
        nodeCount: 61,
        isVisible: true,
        isDocumentVisible: true,
        prefersReducedMotion: false,
      }).directionalParticles,
    ).toBe(0);
    expect(
      getGraphRenderPolicy({
        nodeCount: 12,
        isVisible: true,
        isDocumentVisible: true,
        prefersReducedMotion: true,
      }).directionalParticles,
    ).toBe(0);
  });

  it("does not mount third-party embeds until visible when observer support exists", () => {
    expect(shouldLoadThirdPartyEmbed({ isVisible: false, supportsIntersectionObserver: true })).toBe(false);
    expect(shouldLoadThirdPartyEmbed({ isVisible: true, supportsIntersectionObserver: true })).toBe(true);
    expect(shouldLoadThirdPartyEmbed({ isVisible: false, supportsIntersectionObserver: false })).toBe(true);
  });
});
