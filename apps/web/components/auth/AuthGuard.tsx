"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { api, ApiError } from "@/lib/api";
import { LoaderFive } from "@/components/ui/unique-loader-components";

const MAX_SYNC_ATTEMPTS = 3;
const SYNC_RETRY_DELAYS_MS = [250, 500];

type SyncState = "pending" | "ready" | "error";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [syncState, setSyncState] = useState<SyncState>("pending");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const syncAttemptRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Web app is Clerk-authenticated now; clear legacy token storage on load.
    localStorage.removeItem("jwt");

    const persistedAuth = localStorage.getItem("recall-auth");
    if (persistedAuth) {
      try {
        const parsed = JSON.parse(persistedAuth) as { state?: { token?: string | null } };
        if (parsed?.state?.token) localStorage.removeItem("recall-auth");
      } catch {
        // Ignore malformed legacy persisted state.
      }
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(`${ROUTES.login}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoaded, isSignedIn, router, pathname]);

  // A signed-in Clerk session is not enough to access dashboard data. The
  // local user must be synchronized before any protected child can render.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) {
      setSyncState("pending");
      setSyncError(null);
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    syncAttemptRef.current = 0;
    setSyncState("pending");
    setSyncError(null);

    const sync = async (): Promise<void> => {
      const attempt = syncAttemptRef.current + 1;
      syncAttemptRef.current = attempt;

      try {
        const token = await getToken();
        if (!token) {
          if (attempt < MAX_SYNC_ATTEMPTS) {
            retryTimer = setTimeout(sync, SYNC_RETRY_DELAYS_MS[attempt - 1] ?? 500);
            return;
          }

          throw new Error("Clerk token is unavailable");
        }

        await api.post("/auth/sync", {
          email: clerkUser.primaryEmailAddress?.emailAddress,
          name: clerkUser.fullName,
          avatarUrl: clerkUser.imageUrl,
        }, { token });

        if (!cancelled) setSyncState("ready");
      } catch (err: unknown) {
        if (cancelled) return;

        const status = err instanceof ApiError ? err.status : null;
        const canRetry = status === null || status >= 500 || status === 429;
        if (canRetry && attempt < MAX_SYNC_ATTEMPTS) {
          retryTimer = setTimeout(sync, SYNC_RETRY_DELAYS_MS[attempt - 1] ?? 500);
          return;
        }

        console.error("Sync failed", err);
        setSyncError(
          status === 401
            ? "Your session could not be verified. Please sign in again."
            : "Session synchronization failed. Please try again.",
        );
        setSyncState("error");
      }
    };

    void sync();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isLoaded, isSignedIn, clerkUser, getToken, retryNonce]);

  if (!isLoaded || (isSignedIn && syncState === "pending")) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-background"
      >
        <LoaderFive text="Initializing your Second Brain" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  if (syncState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div role="alert" className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-foreground">Session synchronization failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{syncError}</p>
          <button
            type="button"
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            onClick={() => setRetryNonce((value) => value + 1)}
          >
            Try again
          </button>
          <button
            type="button"
            className="mt-3 block w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => router.replace(`${ROUTES.login}?redirect=${encodeURIComponent(pathname)}`)}
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
