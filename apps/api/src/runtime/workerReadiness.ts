import { checkDependencies, type ReadinessResult } from "./readiness";

export async function getWorkerReadiness(
  ping: () => Promise<string>
): Promise<ReadinessResult> {
  return checkDependencies({
    redis: async () => {
      if ((await ping()) !== "PONG") {
        throw new Error("Redis did not respond with PONG");
      }
    },
  });
}
