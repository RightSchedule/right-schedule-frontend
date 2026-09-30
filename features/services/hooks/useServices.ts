"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi, type ServicePayload } from "@/lib/api/services";
import { qk } from "@/lib/query/keys";

export function useServices() {
  return useQuery({
    queryKey: qk.services,
    queryFn: servicesApi.list,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) => servicesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.services }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: ServicePayload & { id: string }) =>
      servicesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.services }),
  });
}

export function useToggleService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.services }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.services }),
  });
}
