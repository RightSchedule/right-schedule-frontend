"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeForRole, useAccountProfile } from "@/features/auth/hooks/useAccount";

/** Sends a platform admin who lands in the business app (e.g. via a stale link) to the back office. */
export function AdminRedirect() {
  const router = useRouter();
  const { data } = useAccountProfile();
  const home = homeForRole(data?.role);

  useEffect(() => {
    if (data && home === "/admin") router.replace(home);
  }, [data, home, router]);

  return null;
}
