"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { waitlistApi, type JoinWaitlistRequest } from "@/lib/api/waitlist";
import { qk } from "@/lib/query/keys";
import type { WaitlistStatus } from "@/types/domain";

export function useWaitlistPage(status: WaitlistStatus | null, page: number) {
  return useQuery({
    queryKey: qk.waitlist.list(status, page),
    queryFn: () => waitlistApi.page({ status: status ?? undefined, page }),
    placeholderData: keepPreviousData,
  });
}

/** Number of people waiting for a slot, for the dashboard. Only the count is needed, so fetch one row. */
export function useWaitingCount() {
  return useQuery({
    queryKey: qk.waitlist.waiting,
    queryFn: async () => (await waitlistApi.page({ status: "WAITING", size: 1 })).totalElements,
    staleTime: 60_000,
  });
}

export function useRemoveWaitlistEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => waitlistApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.waitlist.all }),
  });
}

export function useJoinWaitlist() {
  return useMutation({ mutationFn: (payload: JoinWaitlistRequest) => waitlistApi.join(payload) });
}
