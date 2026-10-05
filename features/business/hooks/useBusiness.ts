"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  businessApi,
  type BusinessPayload,
  type CreateBusinessPayload,
} from "@/lib/api/businesses";
import { isLocale } from "@/i18n/config";
import { qk } from "@/lib/query/keys";
import type { Business } from "@/types/domain";

export function useBusiness() {
  return useQuery({
    queryKey: qk.business,
    queryFn: businessApi.getMe,
    retry: false,
  });
}

export function useBookingSettings() {
  return useQuery({ queryKey: qk.bookingSettings, queryFn: businessApi.getBookingSettings });
}

export function useUpdateBookingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: businessApi.updateBookingSettings,
    onSuccess: (settings) => {
      qc.setQueryData(qk.bookingSettings, settings);
      qc.invalidateQueries({ queryKey: qk.public.availabilityAll });
    },
  });
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBusinessPayload) => businessApi.create(payload),
    onSuccess: (business) => qc.setQueryData(qk.business, business),
  });
}

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function businessPayload(business: Business, logoUrl: string | undefined): BusinessPayload {
  return {
    name: business.name,
    email: business.email || undefined,
    phone: business.phone || undefined,
    address: business.address || undefined,
    timezone: business.timezone,
    locale: isLocale(business.locale) ? business.locale : undefined,
    defaultMaxPartySize: business.defaultMaxPartySize,
    logoUrl,
  };
}

export class LogoUploadError extends Error {}

/** Presigned PUT to object storage, then save the resulting public URL on the business. */
export function useChangeLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ business, file }: { business: Business; file: File | null }) => {
      let logoUrl: string | undefined;
      if (file) {
        const target = await businessApi.requestLogoUpload(file.type);
        // Signed headers must match exactly; a duplicate differently-cased key would be merged by fetch.
        const headers = new Headers(target.headers);
        if (!headers.has("Content-Type")) headers.set("Content-Type", file.type);
        const res = await fetch(target.uploadUrl, { method: "PUT", headers, body: file }).catch(() => null);
        if (!res?.ok) throw new LogoUploadError();
        logoUrl = target.publicUrl;
      }
      return businessApi.updateMe(businessPayload(business, logoUrl));
    },
    onSuccess: (business) => qc.setQueryData(qk.business, business),
  });
}

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessPayload) => businessApi.updateMe(payload),
    onSuccess: (business) => qc.setQueryData(qk.business, business),
  });
}
