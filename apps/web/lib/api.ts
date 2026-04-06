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

function resolveApiBase(): string {
  if (typeof window === "undefined") return PRELIM_API_BASE;

  // Safety: if app runs on a non-local host, never call localhost API.
  if (!isLocalHost(window.location.hostname) && PRELIM_API_BASE.includes("localhost")) {
    return PROD_API_BASE;
  }

  return PRELIM_API_BASE;
}

const API_BASE = resolveApiBase();

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
  if (res.status === 401) {
    // Handle unauthorized - Clerk usually handles this via middleware/layout
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, res.statusText, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(token),
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  // If body is FormData, remove Content-Type so the browser sets the boundary
  if (fetchOptions.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(url, { ...fetchOptions, headers });
  return handleResponse<T>(res);
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
