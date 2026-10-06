"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { businessApi } from "@/lib/api/businesses";
import { isStatus } from "@/lib/api/client";
import { TERMS_VERSION } from "@/lib/legal";

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
    // The backend sets the HttpOnly session cookie; the token is never exposed to scripts.
    await authApi.login(email, password);

    try {
      await businessApi.getMe();
      router.push(redirectTarget());
    } catch (e) {
      if (!isStatus(e, 404)) {
        await authApi.logout().catch(() => undefined);
        throw e;
      }
      router.push("/onboarding");
    }
  }

  async function register(email: string, password: string) {
    await authApi.register(email, password, TERMS_VERSION);
    await login(email, password);
  }

  async function logout() {
    queryClient.clear();
    await authApi.logout().catch(() => undefined);
    router.push("/login?signedout=1");
  }

  return { login, register, logout };
}
