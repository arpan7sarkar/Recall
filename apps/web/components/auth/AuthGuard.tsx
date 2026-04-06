"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { api, ApiError } from "@/lib/api";
import { LoaderFive } from "@/components/ui/unique-loader-components";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const legacyToken = localStorage.getItem("jwt");
    if (legacyToken?.startsWith("recall_ext_")) {
      localStorage.removeItem("jwt");
    }

    const persistedAuth = localStorage.getItem("recall-auth");
    if (persistedAuth) {
      try {
        const parsed = JSON.parse(persistedAuth) as { state?: { token?: string | null } };
        if (parsed?.state?.token?.startsWith?.("recall_ext_")) {
          localStorage.removeItem("recall-auth");
        }
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

  // Sync user with local DB on first load after sign in
  useEffect(() => {
    async function sync() {
      if (isSignedIn && clerkUser && !synced) {
        try {
          const token = await getToken();
          if (!token) {
            // Token can be briefly unavailable while Clerk hydrates.
            // Keep waiting so child pages do not fire unauthorized API calls.
            return;
          }

          await api.post("/auth/sync", {
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: clerkUser.fullName,
            avatarUrl: clerkUser.imageUrl,
          }, { token: token || undefined });
          setSynced(true);
        } catch (err: unknown) {
          if (err instanceof ApiError && err.status === 401) {
            // Avoid noisy console spam for occasional token timing issues.
            setSynced(true);
            return;
          }
          console.error("Sync failed", err);
          setSynced(true);
        }
      }
    }
    sync();
  }, [isSignedIn, clerkUser, getToken, synced]);

  if (!isLoaded || (isSignedIn && !synced)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-background"
      >
        <LoaderFive text="Initializing your Second Brain" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <>{children}</>;
}
