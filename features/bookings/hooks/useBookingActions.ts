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
