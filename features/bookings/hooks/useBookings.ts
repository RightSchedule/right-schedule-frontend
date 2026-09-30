"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api/bookings";
import { qk } from "@/lib/query/keys";
import { useServices } from "@/features/services/hooks/useServices";
import { useStaff } from "@/features/staff/hooks/useStaff";

interface RangeOptions {
  customerId?: string;
  enabled?: boolean;
}

/** Bookings between two inclusive dates, joined with cached service and staff records. */
export function useBookingsRange(from: string | undefined, to: string | undefined, opts: RangeOptions = {}) {
  const query = useQuery({
    queryKey: qk.bookings.range(from, to, opts.customerId),
    queryFn: () => bookingsApi.list({ from, to, customerId: opts.customerId }),
    enabled: opts.enabled ?? true,
  });
  const services = useServices().data;
  const staff = useStaff().data;

  const data = useMemo(
    () =>
      query.data?.map((b) => {
        const member = staff?.find((s) => s.id === b.staffId);
        return {
          ...b,
          service: services?.find((s) => s.id === b.serviceId),
          staff: member && { id: member.id, name: member.name },
        };
      }),
    [query.data, services, staff]
  );

  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
