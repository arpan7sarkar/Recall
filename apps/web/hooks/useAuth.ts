"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "@/types";

export function useAuth() {
  const { setAuth, logout: storeLogout, user, isAuthenticated } = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await api.post<AuthResponse>("/auth/login", payload);
      setAuth(res.user, res.token);
      return res;
    },
    [setAuth]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const res = await api.post<AuthResponse>("/auth/register", payload);
      setAuth(res.user, res.token);
      return res;
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Server logout failure is non-blocking
    }
    storeLogout();
  }, [storeLogout]);

  const fetchMe = useCallback(async () => {
    const me = await api.get<User>("/auth/me");
    const token = localStorage.getItem("jwt");
    if (token) setAuth(me, token);
    return me;
  }, [setAuth]);

  return { user, isAuthenticated, login, register, logout, fetchMe };
}
