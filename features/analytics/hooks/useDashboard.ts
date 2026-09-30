"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { qk } from "@/lib/query/keys";

export function useDashboard(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: qk.analytics.dashboard(from, to),
    queryFn: () => analyticsApi.dashboard(from, to),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  });
}
