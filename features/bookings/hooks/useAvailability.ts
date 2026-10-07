"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/businesses";
import { qk } from "@/lib/query/keys";

interface Params {
  slug: string;
  serviceId: string | null;
  staffId?: string | null;
  date: string | null;
  partySize?: number;
}

export function useAvailability({ slug, serviceId, staffId, date, partySize = 1 }: Params) {
  return useQuery({
    queryKey: qk.public.availability(slug, serviceId, staffId ?? null, date, partySize),
    queryFn: () =>
      publicApi.getAvailability({
        slug,
        serviceId: serviceId!,
        date: date!,
        staffId: staffId ?? undefined,
        partySize,
      }),
    enabled: !!serviceId && !!date,
  });
}
