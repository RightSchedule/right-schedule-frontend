"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  businessApi,
  type BusinessPayload,
  type CreateBusinessPayload,
} from "@/lib/api/businesses";
import { qk } from "@/lib/query/keys";

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

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessPayload) => businessApi.updateMe(payload),
    onSuccess: (business) => qc.setQueryData(qk.business, business),
  });
}
