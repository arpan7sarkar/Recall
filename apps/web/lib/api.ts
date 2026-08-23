const LOCAL_API_BASE = "http://localhost:4000/v1";
const DEFAULT_PROD_API_BASE = "https://recall-z9zo.onrender.com/v1";

const DEV_API_BASE =
  process.env.NEXT_PUBLIC_API_URL_DEV ??
  process.env.NEXT_PUBLIC_API_URL ??
  LOCAL_API_BASE;

const PROD_API_BASE =
  process.env.NEXT_PUBLIC_RENDER_API_URL ??
  process.env.NEXT_PUBLIC_API_URL_PROD ??
  process.env.NEXT_PUBLIC_API_URL ??
  DEFAULT_PROD_API_BASE;

const PRELIM_API_BASE = process.env.NODE_ENV === "production" ? PROD_API_BASE : DEV_API_BASE;

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function resolveApiBase(location?: Pick<Location, "hostname">): string {
  const hostname = location?.hostname ?? (typeof window === "undefined" ? undefined : window.location.hostname);
  const preliminary = PRELIM_API_BASE.replace(/\/$/, "");
  const production = PROD_API_BASE.replace(/\/$/, "");
  if (!hostname) return preliminary;

  // Safety: if app runs on a non-local host, never call localhost API.
  if (!isLocalHost(hostname) && preliminary.includes("localhost")) {
    return production;
  }

  return preliminary;
}

const API_BASE = resolveApiBase();
const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000);

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

export type ApiTransportErrorKind = "timeout" | "offline" | "network";

export class ApiTransportError extends Error {
  constructor(public kind: ApiTransportErrorKind, message: string, public requestId?: string) {
    super(message);
    this.name = "ApiTransportError";
  }
}

export function classifyApiError(error: unknown): "auth" | "validation" | "conflict" | "dependency" | "offline" | "unknown" {
  if (error instanceof ApiTransportError) return "offline";
  if (!(error instanceof ApiError)) return "unknown";
  if (error.status === 401 || error.status === 403) return "auth";
  if (error.status === 400 || error.status === 422) return "validation";
  if (error.status === 409) return "conflict";
  if (error.status === 408 || error.status === 429 || error.status >= 500) return "dependency";
  return "unknown";
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError && typeof error.body === "object" && error.body !== null) {
    const body = error.body as { error?: unknown; message?: unknown; reason?: unknown };
    const primary = typeof body.error === "string" ? body.error : typeof body.message === "string" ? body.message : null;
    const reason = typeof body.reason === "string" ? body.reason : null;
    if (primary && reason && !primary.toLowerCase().includes(reason.toLowerCase())) return `${primary} ${reason}`;
    if (primary) return primary;
    if (reason) return reason;
  }
  if (error instanceof Error && error.message && !error.message.startsWith("API ")) return error.message;
  return fallback;
}

function getAuthHeaders(token?: string): Record<string, string> {
  if (token) return { Authorization: `Bearer ${token}` };
  if (typeof window === "undefined") return {};
  const enableLegacyJwtFallback = process.env.NEXT_PUBLIC_ENABLE_LEGACY_JWT_FALLBACK === "true";
  if (!enableLegacyJwtFallback) {
    return {};
  }

  const localToken = localStorage.getItem("jwt"); // Fallback for transition
  if (!localToken) return {};

  // Never send extension tokens from web app requests.
  if (localToken.startsWith("recall_ext_")) {
    localStorage.removeItem("jwt");
    return {};
  }

  // Basic JWT shape check to avoid sending random/stale tokens.
  if (localToken.split(".").length !== 3) {
    localStorage.removeItem("jwt");
    return {};
  }

  return { Authorization: `Bearer ${localToken}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().then((text) => {
      if (!text) return null;
      try { return JSON.parse(text); } catch { return { error: text }; }
    });
    throw new ApiError(res.status, res.statusText, body);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  return JSON.parse(text) as T;
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `recall-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { token?: string; requestId?: string } = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const { token, requestId = createRequestId(), ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": requestId,
    ...getAuthHeaders(token),
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  // If body is FormData, remove Content-Type so the browser sets the boundary
  if (fetchOptions.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const controller = new AbortController();
  const timeoutMs = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0 ? REQUEST_TIMEOUT_MS : 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...fetchOptions, headers, signal: controller.signal });
    return await handleResponse<T>(res);
  } catch (error) {
    if (error instanceof ApiError || error instanceof ApiTransportError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiTransportError("timeout", `Request timed out after ${timeoutMs}ms.`, requestId);
    }
    if (error instanceof TypeError) {
      throw new ApiTransportError("offline", "The API is unreachable. Check your connection and try again.", requestId);
    }
    throw new ApiTransportError("network", "The request could not be completed. Please try again.", requestId);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(url: string, options?: { token?: string }) => apiFetch<T>(url, { method: "GET", ...options }),

  post: <T>(url: string, body?: unknown, options?: { token?: string }) =>
    apiFetch<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options
    }),

  patch: <T>(url: string, body?: unknown, options?: { token?: string }) =>
    apiFetch<T>(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...options
    }),

  delete: <T>(url: string, options?: { token?: string }) => apiFetch<T>(url, { method: "DELETE", ...options }),

  upload: <T>(url: string, formData: FormData, options?: { token?: string }) =>
    apiFetch<T>(url, { method: "POST", body: formData, ...options }),
};
