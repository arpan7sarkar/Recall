export const ITEM_PROCESSING_POLL_INTERVAL_MS = 5_000;
export const ITEM_PROCESSING_POLL_MAX_DURATION_MS = 60_000;
export const MAX_GRAPH_PARTICLE_NODES = 60;
export const GRAPH_COOLDOWN_TIME_MS = 10_000;

export function getItemProcessingPollInterval(input: {
  hasPendingProcessing: boolean;
  pollingStartedAt: number | null;
  now: number;
}): number | false {
  if (!input.hasPendingProcessing) return false;
  if (
    input.pollingStartedAt !== null &&
    input.now - input.pollingStartedAt >= ITEM_PROCESSING_POLL_MAX_DURATION_MS
  ) {
    return false;
  }
  return ITEM_PROCESSING_POLL_INTERVAL_MS;
}

export function getGraphRenderPolicy(input: {
  nodeCount: number;
  isVisible: boolean;
  isDocumentVisible: boolean;
  prefersReducedMotion: boolean;
}) {
  const animateParticles =
    input.isVisible &&
    input.isDocumentVisible &&
    !input.prefersReducedMotion &&
    input.nodeCount <= MAX_GRAPH_PARTICLE_NODES;

  return {
    directionalParticles: animateParticles ? 1 : 0,
    cooldownTicks: Math.min(160, Math.max(40, input.nodeCount * 3)),
    cooldownTime: GRAPH_COOLDOWN_TIME_MS,
  };
}

export function shouldLoadThirdPartyEmbed(input: {
  isVisible: boolean;
  supportsIntersectionObserver: boolean;
}) {
  return input.isVisible || !input.supportsIntersectionObserver;
}
