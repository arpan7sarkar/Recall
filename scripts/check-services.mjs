const checks = [
  ["api", process.env.API_READINESS_URL ?? "http://localhost:4000/ready"],
  ["worker", process.env.WORKER_READINESS_URL ?? "http://localhost:4001/ready"],
];

const timeoutMs = Number(process.env.READINESS_TIMEOUT_MS ?? 3000);
const results = await Promise.all(checks.map(async ([name, url]) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    return { name, url, ok: response.ok, status: response.status, body };
  } catch (error) {
    return { name, url, ok: false, status: 0, body: { error: error instanceof Error ? error.message : "request failed" } };
  } finally {
    clearTimeout(timeout);
  }
}));

for (const result of results) {
  const state = result.ok ? "ready" : "not ready";
  console.log(`${result.name}: ${state} (${result.url})`, result.body);
}

if (results.some((result) => !result.ok)) process.exit(1);
