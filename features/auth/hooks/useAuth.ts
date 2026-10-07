"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { homeForRole } from "@/features/auth/hooks/useAccount";
import { authApi } from "@/lib/api/auth";
import { businessApi } from "@/lib/api/businesses";
import { isStatus } from "@/lib/api/client";
import { TERMS_VERSION } from "@/lib/legal";

/** The `redirect` param if it is a same-origin path inside the area the role may use, else the role's home. */
function redirectTarget(home: string): string {
  const target = new URLSearchParams(window.location.search).get("redirect");
  if (!target || !target.startsWith("/") || target.includes("\\")) return home;
  const url = new URL(target, window.location.origin);
  if (url.origin !== window.location.origin) return home;
  const inAdmin = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  if (inAdmin !== (home === "/admin")) return home;
  return url.pathname + url.search + url.hash;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function login(email: string, password: string) {
    // The backend sets the HttpOnly session cookie; the token is never exposed to scripts.
    const { role } = await authApi.login(email, password);
    // Admins own no business; asking for one would fail with 403.
    if (homeForRole(role) === "/admin") {
      router.push(redirectTarget("/admin"));
      return;
    }

    try {
      await businessApi.getMe();
      router.push(redirectTarget("/dashboard"));
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
