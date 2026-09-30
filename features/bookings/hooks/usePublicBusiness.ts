"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/businesses";
import { qk } from "@/lib/query/keys";

export function usePublicBusiness(slug: string) {
  return useQuery({
    queryKey: qk.public.business(slug),
    queryFn: () => publicApi.getBusiness(slug),
    retry: false,
  });
}
