"use client";

import { useQuery } from "@tanstack/react-query";
import { accountApi } from "@/lib/api/account";
import { qk } from "@/lib/query/keys";
import type { UserRole } from "@/types/domain";

/** The signed-in account. Its role only changes with a new session, so it is fetched once per page load. */
export function useAccountProfile() {
  return useQuery({
    queryKey: qk.account,
    queryFn: accountApi.me,
    staleTime: Infinity,
    retry: false,
  });
}

/** Landing page after sign-in: the back office for platform admins, the business app for everyone else. */
export function homeForRole(role: UserRole | string | undefined): string {
  return role === "PLATFORM_ADMIN" ? "/admin" : "/dashboard";
}
