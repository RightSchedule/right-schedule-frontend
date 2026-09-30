"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { businessApi } from "@/lib/api/businesses";
import { isStatus } from "@/lib/api/client";
import { setToken, clearTokens } from "@/lib/auth/session";

function redirectTarget(): string {
  const target = new URLSearchParams(window.location.search).get("redirect");
  if (!target || !target.startsWith("/") || target.includes("\\")) return "/dashboard";
  const url = new URL(target, window.location.origin);
  return url.origin === window.location.origin ? url.pathname + url.search + url.hash : "/dashboard";
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function login(email: string, password: string) {
    const { token } = await authApi.login(email, password);
    setToken(token);

    try {
      await businessApi.getMe();
      router.push(redirectTarget());
    } catch (e) {
      if (!isStatus(e, 404)) {
        clearTokens();
        throw e;
      }
      router.push("/onboarding");
    }
  }

  async function register(email: string, password: string) {
    await authApi.register(email, password);
    await login(email, password);
  }

  function logout() {
    queryClient.clear();
    clearTokens();
    router.push("/login");
  }

  return { login, register, logout };
}
