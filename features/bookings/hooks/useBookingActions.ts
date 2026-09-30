"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api/bookings";
import { qk } from "@/lib/query/keys";

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "cancel" | "complete" | "no-show";
    }) => {
      if (action === "cancel") return bookingsApi.cancel(id);
      if (action === "complete") return bookingsApi.complete(id);
      return bookingsApi.noShow(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.bookings.all }),
  });
}

/** Completes many bookings at once. Failures don't abort the rest; the result reports both counts. */
export function useBulkCompleteBookings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => bookingsApi.complete(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      return { succeeded, failed: results.length - succeeded };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.bookings.all }),
  });
}
