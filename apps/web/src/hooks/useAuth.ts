"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { routes } from "@/config/site";

interface LoginData   { email: string; password: string; }
interface SignupData  { username: string; email: string; password: string; }

interface AuthResponse {
  user: {
    id: string; username: string; displayName: string;
    avatarUrl: string | null; level: number; xp: number; isPremium: boolean;
  };
  token: string;
}

export function useAuth() {
  const router                      = useRouter();
  const { user, token, setUser, clearUser, setLoading } = useAuthStore();

  // ── Silent refresh on app boot ──────────────────────────────
  const initAuth = useCallback(async () => {
    setLoading(true);
    try {
      // Try to refresh using httpOnly cookie
      const data = await api.post<AuthResponse>("/auth/refresh", {});
      setUser(data.user, data.token);
      connectSocket(data.token);
    } catch {
      clearUser();
    } finally {
      setLoading(false);
    }
  }, [setUser, clearUser, setLoading]);

  // ── Login ───────────────────────────────────────────────────
  const login = useCallback(async (data: LoginData) => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    setUser(res.user, res.token);
    connectSocket(res.token);
    return res;
  }, [setUser]);

  // ── Signup ──────────────────────────────────────────────────
  const signup = useCallback(async (data: SignupData) => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    setUser(res.user, res.token);
    connectSocket(res.token);
    return res;
  }, [setUser]);

  // ── Logout ──────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {}, token ?? undefined);
    } catch {}
    disconnectSocket();
    clearUser();
    router.push(routes.login);
  }, [token, clearUser, router]);

  return { user, token, login, signup, logout, initAuth };
}