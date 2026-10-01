"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { bookingsApi, type SortDirection } from "@/lib/api/bookings";
import { qk } from "@/lib/query/keys";
import { useServices } from "@/features/services/hooks/useServices";
import { useStaff } from "@/features/staff/hooks/useStaff";
import type { Booking } from "@/types/domain";

interface RangeOptions {
  customerId?: string;
  enabled?: boolean;
}

export const REVIEW_PAGE_SIZE = 25;
export const CUSTOMER_HISTORY_PAGE_SIZE = 10;

/** Joins bookings with cached service and staff records using O(1) lookups. */
function useEnrichedBookings(bookings: Booking[] | undefined) {
  const services = useServices().data;
  const staff = useStaff().data;

  return useMemo(() => {
    if (!bookings) return undefined;
    const serviceById = new Map(services?.map((s) => [s.id, s]));
    const staffById = new Map(staff?.map((s) => [s.id, s]));
    return bookings.map((b) => {
      const member = staffById.get(b.staffId);
      return {
        ...b,
        service: serviceById.get(b.serviceId),
        staff: member && { id: member.id, name: member.name },
      };
    });
  }, [bookings, services, staff]);
}

/** One page of overdue bookings, joined with cached service and staff records. */
export function useReviewBookings(page: number) {
  const query = useQuery({
    queryKey: qk.bookings.review(page),
    queryFn: () => bookingsApi.reviewPage({ page, size: REVIEW_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const bookings = useEnrichedBookings(query.data?.content);

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

/** One page of a customer's booking history, newest first, joined with cached service and staff records. */
export function useCustomerBookingsPage(customerId: string, sort: SortDirection, page: number) {
  const query = useQuery({
    queryKey: qk.bookings.customerHistory(customerId, sort, page),
    queryFn: () =>
      bookingsApi.customerHistoryPage({ customerId, sort, page, size: CUSTOMER_HISTORY_PAGE_SIZE }),
    enabled: !!customerId,
    placeholderData: keepPreviousData,
  });
  const bookings = useEnrichedBookings(query.data?.content);

  return {
    bookings,
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
  const data = useEnrichedBookings(query.data);

  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
