import { apiClient } from "./client";
import { fetchPage, listAll, type PageResponse } from "./page";
import type { Booking, BookingStatus } from "@/types/domain";

export interface PublicBookingRequest {
  businessId: string;
  serviceId: string;
  staffId?: string | null;
  startDateTime: string;
  customer: { name: string; phone?: string; email?: string };
  notes?: string;
  /** Customer's UI language ("en" | "pt"); the backend uses it for confirmation/reminder emails. */
  locale?: string;
}

export interface BookingResponse {
  id: string;
  businessId: string;
  customerId: string | null;
  staffId: string;
  serviceId: string;
  startDateTime: string;
  endDateTime: string;
  status: BookingStatus;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  needsReviewAt?: string | null;
}

function normalizeBooking(r: BookingResponse): Booking {
  return {
    id: r.id,
    businessId: r.businessId,
    serviceId: r.serviceId,
    staffId: r.staffId,
    customerId: r.customerId,
    date: r.startDateTime.slice(0, 10),
    startTime: r.startDateTime.slice(11, 16),
    endTime: r.endDateTime.slice(11, 16),
    status: r.status,
    notes: r.notes,
    needsReviewAt: r.needsReviewAt,
    customer: {
      id: r.customerId ?? "",
      businessId: r.businessId,
      name: r.customerName,
      phone: r.customerPhone,
      email: r.customerEmail,
    },
  };
}

export type SortDirection = "asc" | "desc";

export interface ListBookingsParams {
  from?: string;
  to?: string;
  staffId?: string;
  customerId?: string;
  status?: BookingStatus;
}

export const bookingsApi = {
  /** One page of overdue bookings, oldest first (the backend sorts by start time). */
  reviewPage: async ({ page = 0, size = 25 }: { page?: number; size?: number } = {}): Promise<PageResponse<Booking>> => {
    const res = await fetchPage<BookingResponse>("/api/v1/bookings", { needsReview: true, page, size });
    return { ...res, content: res.content.map(normalizeBooking) };
  },

  /** One page of a customer's bookings; ordering uses the backend `direction` param (ASC | DESC). */
  customerHistoryPage: async ({
    customerId,
    sort = "desc",
    page = 0,
    size = 10,
  }: {
    customerId: string;
    sort?: SortDirection;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Booking>> => {
    const res = await fetchPage<BookingResponse>("/api/v1/bookings", {
      customerId,
      direction: sort.toUpperCase(),
      page,
      size,
    });
    return { ...res, content: res.content.map(normalizeBooking) };
  },

  createPublic: async (payload: PublicBookingRequest, idempotencyKey?: string) => {
    const body = { ...payload, staffId: payload.staffId ?? undefined };
    const res = await apiClient.post<BookingResponse>("/api/v1/public/bookings", body, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
    return normalizeBooking(res);
  },

  list: async (params: ListBookingsParams = {}): Promise<Booking[]> => {
    const rows = await listAll<BookingResponse>("/api/v1/bookings", { ...params });
    return rows.map(normalizeBooking);
  },

  cancel: (id: string) =>
    apiClient.patch<BookingResponse>(`/api/v1/bookings/${id}/cancel`, {}).then(normalizeBooking),

  complete: (id: string) =>
    apiClient.patch<BookingResponse>(`/api/v1/bookings/${id}/complete`, {}).then(normalizeBooking),

  noShow: (id: string) =>
    apiClient.patch<BookingResponse>(`/api/v1/bookings/${id}/no-show`, {}).then(normalizeBooking),
};
