import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut, getToken } = useClerkAuth();

  const syncUser = useCallback(async () => {
    if (!clerkUser) return null;
    
    // Sync with local DB
    const token = await getToken();
    const res = await api.post<{ user: User }>("/auth/sync", {
      email: clerkUser.primaryEmailAddress?.emailAddress,
      name: clerkUser.fullName,
      avatarUrl: clerkUser.imageUrl,
    }, { token: token || undefined });
    return res.user;
  }, [clerkUser, getToken]);

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const fetchMe = useCallback(async () => {
    const me = await api.get<User>("/auth/me");
    return me;
  }, []);

  // Map Clerk user to our User type conceptually if needed
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || "Anonymous",
    avatarUrl: clerkUser.imageUrl || null,
    googleId: null, // Clerk handles this, we map if needed later
    createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
  } : null;

  return { 
    user, 
    isAuthenticated: isSignedIn ?? false, 
    isLoaded,
    logout, 
    syncUser,
    fetchMe,
    getToken 
  };
}
