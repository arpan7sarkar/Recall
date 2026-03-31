"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Allow Zustand persist to hydrate before checking
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        router.replace(`${ROUTES.login}?redirect=${encodeURIComponent(pathname)}`);
      }
      setChecked(true);
    });

    // If already hydrated (fast path)
    if (useAuthStore.persist.hasHydrated()) {
      if (!isAuthenticated) {
        router.replace(`${ROUTES.login}?redirect=${encodeURIComponent(pathname)}`);
      }
      setChecked(true);
    }

    return unsub;
  }, [isAuthenticated, router, pathname]);

  if (!checked) {
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
            <span className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%" }} />
            <span className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%", animationDelay: "0.2s" }} />
            <span className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%", animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
