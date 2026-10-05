"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { waitlistApi } from "@/lib/api/waitlist";
import { qk } from "@/lib/query/keys";
import type { WaitlistStatus } from "@/types/domain";

export function useWaitlistPage(status: WaitlistStatus | null, page: number) {
  return useQuery({
    queryKey: qk.waitlist.list(status, page),
    queryFn: () => waitlistApi.page({ status: status ?? undefined, page }),
    placeholderData: keepPreviousData,
  });
}

export function useRemoveWaitlistEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => waitlistApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.waitlist.all }),
  });
}
