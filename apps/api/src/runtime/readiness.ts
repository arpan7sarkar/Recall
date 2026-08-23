export type DependencyCheck = () => Promise<unknown>;

export type ReadinessCheck = {
  status: "ok" | "error";
};

export type ReadinessResult = {
  status: "ready" | "not_ready";
  checks: Record<string, ReadinessCheck>;
};

const defaultTimeoutMs = 3000;

function getReadinessTimeoutMs(): number {
  const configured = Number(process.env.READINESS_TIMEOUT_MS ?? defaultTimeoutMs);
  return Number.isFinite(configured) && configured > 0 ? configured : defaultTimeoutMs;
}

export async function checkDependencies(
  checks: Record<string, DependencyCheck>,
  timeoutMs = getReadinessTimeoutMs()
): Promise<ReadinessResult> {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, check]) => {
      let timeout: NodeJS.Timeout | undefined;
      try {
        await Promise.race([
          check(),
          new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(
              () => reject(new Error("Readiness check timed out")),
              timeoutMs
            );
            timeout.unref();
          }),
        ]);
        return [name, { status: "ok" as const }] as const;
      } catch {
        return [name, { status: "error" as const }] as const;
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    })
  );

  const result = Object.fromEntries(entries) as Record<string, ReadinessCheck>;
  const ready = Object.values(result).every((check) => check.status === "ok");

  return {
    status: ready ? "ready" : "not_ready",
    checks: result,
  };
}

export function readinessHttpStatus(result: ReadinessResult): 200 | 503 {
  return result.status === "ready" ? 200 : 503;
}
