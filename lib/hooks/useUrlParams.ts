"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Read and update the query string without adding history entries. Pages using it need a Suspense boundary. */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  return { params, set };
}

/** URL pages are 1-based; components use 0-based. Anything invalid is page 0. */
export function pageFromParam(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 2 ? n - 1 : 0;
}

export function pageToParam(page: number): string | null {
  return page > 0 ? String(page + 1) : null;
}
