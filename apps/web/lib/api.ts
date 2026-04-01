const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

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
  const localToken = localStorage.getItem("jwt"); // Fallback for transition
  return localToken ? { Authorization: `Bearer ${localToken}` } : {};
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
