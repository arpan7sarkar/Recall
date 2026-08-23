import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 3;

export class RemoteFetchError extends Error {
  readonly code:
    | "INVALID_URL"
    | "UNSAFE_URL"
    | "TIMEOUT"
    | "HTTP_ERROR"
    | "TOO_LARGE"
    | "CONTENT_TYPE"
    | "REDIRECT_LIMIT";

  constructor(
    code: RemoteFetchError["code"],
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RemoteFetchError";
    this.code = code;
  }
}

export interface RemoteFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  allowedContentTypes?: readonly string[];
}

export interface RemoteResource {
  url: string;
  contentType: string | null;
  buffer: Buffer;
}

function normalizedHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/\.$/, "");
}

function isPrivateIpv4(host: string): boolean {
  const octets = host.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  if (!normalized.includes(":")) return false;
  if (normalized === "::" || normalized === "::1" || normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("ff")) return true;

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

function isUnsafeHostname(host: string): boolean {
  const unbracketed = host.replace(/^\[/, "").replace(/\]$/, "");
  if (!unbracketed || unbracketed === "localhost" || unbracketed.endsWith(".localhost") || unbracketed.endsWith(".local")) return true;
  if (isIP(unbracketed) === 4) return isPrivateIpv4(unbracketed);
  if (isIP(unbracketed) === 6) return isPrivateIpv6(unbracketed);
  return false;
}

export function assertSafeRemoteUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch (error) {
    throw new RemoteFetchError("INVALID_URL", "Remote URL is invalid.", { cause: error });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RemoteFetchError("INVALID_URL", "Remote URL must use http or https.");
  }
  if (url.username || url.password) {
    throw new RemoteFetchError("UNSAFE_URL", "Remote URL cannot contain credentials.");
  }
  if (isUnsafeHostname(normalizedHost(url))) {
    throw new RemoteFetchError("UNSAFE_URL", "Remote URL targets a private or local address.");
  }

  return url;
}

async function assertResolvedHostIsPublic(url: URL): Promise<void> {
  const host = normalizedHost(url);
  if (isIP(host)) return;

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch (error) {
    throw new RemoteFetchError("UNSAFE_URL", "Remote hostname could not be resolved safely.", { cause: error });
  }

  if (records.length === 0 || records.some((record) => isUnsafeHostname(record.address))) {
    throw new RemoteFetchError("UNSAFE_URL", "Remote hostname resolves to a private or local address.");
  }
}

function parseLimit(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;
}

function contentTypeAllowed(contentType: string | null, allowed: readonly string[] | undefined): boolean {
  if (!allowed || allowed.length === 0 || !contentType) return true;
  const normalized = contentType.split(";", 1)[0].trim().toLowerCase();
  return allowed.some((entry) => {
    const expected = entry.toLowerCase();
    return expected.endsWith("/") ? normalized.startsWith(expected) : normalized === expected;
  });
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RemoteFetchError("TOO_LARGE", "Remote response exceeds the configured size limit.");
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new RemoteFetchError("TOO_LARGE", "Remote response exceeds the configured size limit.");
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new RemoteFetchError("TOO_LARGE", "Remote response exceeds the configured size limit.");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

export async function fetchRemoteResource(
  value: string,
  options: RemoteFetchOptions = {},
): Promise<RemoteResource> {
  const timeoutMs = parseLimit(options.timeoutMs, DEFAULT_TIMEOUT_MS);
  const maxBytes = parseLimit(options.maxBytes, DEFAULT_MAX_BYTES);
  const maxRedirects = parseLimit(options.maxRedirects, DEFAULT_MAX_REDIRECTS);
  let currentUrl = assertSafeRemoteUrl(value);
  await assertResolvedHostIsPublic(currentUrl);

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: "text/html,application/xhtml+xml,application/pdf,image/*,application/json" },
      });
    } catch (error) {
      clearTimeout(timeout);
      if (controller.signal.aborted) {
        throw new RemoteFetchError("TIMEOUT", "Remote request timed out.", { cause: error });
      }
      throw new RemoteFetchError("HTTP_ERROR", "Remote request failed.", { cause: error });
    }

    if (response.status >= 300 && response.status < 400) {
      clearTimeout(timeout);
      const location = response.headers.get("location");
      if (!location) throw new RemoteFetchError("HTTP_ERROR", "Remote response contained an invalid redirect.");
      if (redirect >= maxRedirects) {
        throw new RemoteFetchError("REDIRECT_LIMIT", "Remote response exceeded the redirect limit.");
      }
      currentUrl = assertSafeRemoteUrl(new URL(location, currentUrl).toString());
      await assertResolvedHostIsPublic(currentUrl);
      continue;
    }

    if (!response.ok) {
      clearTimeout(timeout);
      throw new RemoteFetchError("HTTP_ERROR", `Remote request failed with status ${response.status}.`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentTypeAllowed(contentType, options.allowedContentTypes)) {
      clearTimeout(timeout);
      throw new RemoteFetchError("CONTENT_TYPE", "Remote response has an unsupported content type.");
    }
    let buffer: Buffer;
    try {
      buffer = await readBoundedBody(response, maxBytes);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new RemoteFetchError("TIMEOUT", "Remote response timed out.", { cause: error });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    return { url: currentUrl.toString(), contentType, buffer };
  }

  throw new RemoteFetchError("REDIRECT_LIMIT", "Remote response exceeded the redirect limit.");
}

export async function fetchRemoteText(
  value: string,
  options: RemoteFetchOptions = {},
): Promise<RemoteResource & { text: string }> {
  const resource = await fetchRemoteResource(value, options);
  return { ...resource, text: resource.buffer.toString("utf8") };
}

export async function fetchRemoteJson<T>(
  value: string,
  options: RemoteFetchOptions = {},
): Promise<T> {
  const resource = await fetchRemoteResource(value, options);
  try {
    return JSON.parse(resource.buffer.toString("utf8")) as T;
  } catch (error) {
    throw new RemoteFetchError("HTTP_ERROR", "Remote response was not valid JSON.", { cause: error });
  }
}
