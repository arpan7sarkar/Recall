export const DEFAULT_AUTH_REDIRECT = "/dashboard";

/**
 * Keep Clerk redirects on this origin and preserve only an internal path.
 */
export function getSafeAuthRedirect(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (
    !candidate
    || candidate.length > 2048
    || !candidate.startsWith("/")
    || candidate.startsWith("//")
    || candidate.includes("\\")
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const resolved = new URL(candidate, "http://recall.local");
    if (resolved.origin !== "http://recall.local") return DEFAULT_AUTH_REDIRECT;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function getAuthRouteWithRedirect(route: "/login" | "/register", redirect: string): string {
  if (redirect === DEFAULT_AUTH_REDIRECT) return route;
  return `${route}?redirect=${encodeURIComponent(redirect)}`;
}
