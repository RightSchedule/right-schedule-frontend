"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/businesses";
import { qk } from "@/lib/query/keys";

export function publicStaffOptions(slug: string, serviceId: string | null) {
  return queryOptions({
    queryKey: qk.public.staff(slug, serviceId),
    queryFn: () => publicApi.getStaff(slug, serviceId),
    retry: false,
  });
}

export function usePublicStaff(slug: string, serviceId: string | null) {
  return useQuery({ ...publicStaffOptions(slug, serviceId), enabled: !!serviceId });
}
