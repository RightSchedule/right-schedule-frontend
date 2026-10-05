import { apiClient } from "./client";
import type { AppLocale } from "@/i18n/config";
import type { BookingSettings, Business, PublicBusiness, PublicStaff } from "@/types/domain";
import type { AvailabilityResponse } from "@/types/api";

export interface BusinessPayload {
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  logoUrl?: string;
  /** Language of the notification emails the business receives. */
  locale?: AppLocale;
  defaultMaxPartySize?: number;
}

export interface CreateBusinessPayload extends BusinessPayload {
  slug: string;
}

export interface LogoUpload {
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
  headers?: Record<string, string>;
}

export const businessApi = {
  requestLogoUpload: (contentType: string) =>
    apiClient.post<LogoUpload>("/api/v1/business/me/logo-upload", { contentType }),

  create: (payload: CreateBusinessPayload) =>
    apiClient.post<Business>("/api/v1/business", payload),

  getMe: () => apiClient.get<Business>("/api/v1/business/me"),

  updateMe: (payload: BusinessPayload) =>
    apiClient.put<Business>("/api/v1/business/me", payload),

  getBookingSettings: () => apiClient.get<BookingSettings>("/api/v1/business/me/booking-settings"),

  updateBookingSettings: (payload: BookingSettings) =>
    apiClient.put<BookingSettings>("/api/v1/business/me/booking-settings", payload),
};

export const publicApi = {
  getAvailability: (params: {
    slug: string;
    serviceId: string;
    date: string;
    staffId?: string;
    partySize?: number;
  }) => {
    const query = new URLSearchParams({
      serviceId: params.serviceId,
      date: params.date,
      ...(params.staffId ? { staffId: params.staffId } : {}),
      ...(params.partySize && params.partySize > 1 ? { partySize: String(params.partySize) } : {}),
    });
    return apiClient.get<AvailabilityResponse>(
      `/api/v1/public/businesses/${params.slug}/availability?${query}`
    );
  },

  getBusiness: (slug: string) =>
    apiClient.get<PublicBusiness>(`/api/v1/public/businesses/${slug}`),

  getStaff: (slug: string, serviceId?: string | null) => {
    const qs = serviceId ? `?${new URLSearchParams({ serviceId })}` : "";
    return apiClient
      .get<{ content: PublicStaff[] }>(`/api/v1/public/businesses/${slug}/staff${qs}`)
      .then((r) => r.content);
  },
};
