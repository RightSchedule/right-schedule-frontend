"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api/bookings";
import { qk } from "@/lib/query/keys";
import type { ManagedBooking } from "@/types/domain";

export function useManagedBooking(token: string) {
  return useQuery({
    queryKey: qk.public.managedBooking(token),
    queryFn: () => bookingsApi.getManaged(token),
    retry: false,
  });
}

function useManagedBookingMutation<TVars>(token: string, fn: (vars: TVars) => Promise<ManagedBooking>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (booking) => {
      qc.setQueryData(qk.public.managedBooking(token), booking);
      qc.invalidateQueries({ queryKey: qk.public.availabilityAll });
    },
  });
}

export function useCancelManagedBooking(token: string) {
  return useManagedBookingMutation(token, () => bookingsApi.cancelManaged(token));
}

export function useRescheduleManagedBooking(token: string) {
  return useManagedBookingMutation(token, (startDateTime: string) =>
    bookingsApi.rescheduleManaged(token, startDateTime)
  );
}
