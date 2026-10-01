"use client";

import { useQuery } from "@tanstack/react-query";
import { servicesApi, type ServicePayload } from "@/lib/api/services";
import { qk } from "@/lib/query/keys";
import { useInvalidatingMutation } from "@/lib/query/useInvalidatingMutation";

const servicesKey = () => qk.services;

export function useServices() {
  return useQuery({
    queryKey: qk.services,
    queryFn: servicesApi.list,
  });
}

export function useCreateService() {
  return useInvalidatingMutation((payload: ServicePayload) => servicesApi.create(payload), servicesKey);
}

export function useUpdateService() {
  return useInvalidatingMutation(
    ({ id, ...payload }: ServicePayload & { id: string }) => servicesApi.update(id, payload),
    servicesKey
  );
}

export function useToggleService() {
  return useInvalidatingMutation((id: string) => servicesApi.toggle(id), servicesKey);
}

export function useDeleteService() {
  return useInvalidatingMutation((id: string) => servicesApi.delete(id), servicesKey);
}
