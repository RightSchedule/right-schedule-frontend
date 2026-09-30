"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/businesses";
import { qk } from "@/lib/query/keys";

interface Params {
  slug: string;
  serviceId: string | null;
  staffId?: string | null;
  date: string | null;
}

export function useAvailability({ slug, serviceId, staffId, date }: Params) {
  return useQuery({
    queryKey: qk.public.availability(slug, serviceId, staffId ?? null, date),
    queryFn: () =>
      publicApi.getAvailability({
        slug,
        serviceId: serviceId!,
        date: date!,
        staffId: staffId ?? undefined,
      }),
    enabled: !!serviceId && !!date,
  });
}
