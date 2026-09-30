"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api/bookings";
import { qk } from "@/lib/query/keys";
import { useServices } from "@/features/services/hooks/useServices";
import { useStaff } from "@/features/staff/hooks/useStaff";

interface RangeOptions {
  customerId?: string;
  enabled?: boolean;
}

export const REVIEW_PAGE_SIZE = 25;

/** One page of overdue bookings, joined with cached service and staff records. */
export function useReviewBookings(page: number) {
  const query = useQuery({
    queryKey: qk.bookings.review(page),
    queryFn: () => bookingsApi.reviewPage({ page, size: REVIEW_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const services = useServices().data;
  const staff = useStaff().data;

  const bookings = useMemo(
    () =>
      query.data?.content.map((b) => {
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
    bookings,
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Number of overdue bookings, for badges. Only the count is needed, so fetch one row. */
export function useReviewCount() {
  return useQuery({
    queryKey: qk.bookings.reviewCount,
    queryFn: async () => (await bookingsApi.reviewPage({ size: 1 })).totalElements,
    staleTime: 60_000,
  });
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
