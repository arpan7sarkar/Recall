"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { api } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [synced, setSynced] = useState(false);

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
          await api.post("/auth/sync", {
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: clerkUser.fullName,
            avatarUrl: clerkUser.imageUrl,
          }, { token: token || undefined });
          setSynced(true);
        } catch (err) {
          console.error("Sync failed", err);
        }
      }
    }
    sync();
  }, [isSignedIn, clerkUser, getToken, synced]);

  if (!isLoaded || (isSignedIn && !synced && !clerkUser)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl font-bold text-white text-lg"
            style={{ width: 44, height: 44, background: "var(--accent-500)" }}
          >
            R
          </div>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse delay-75" />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse delay-150" />
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <>{children}</>;
}
