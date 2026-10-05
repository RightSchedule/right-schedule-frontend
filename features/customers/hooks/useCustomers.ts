"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { customersApi, type CustomerPayload } from "@/lib/api/customers";
import { qk } from "@/lib/query/keys";
import { downloadJson } from "@/lib/utils/download";

export function useCustomersPage(search: string, page: number) {
  return useQuery({
    queryKey: qk.customers.list(search, page),
    queryFn: () => customersApi.page({ search, page }),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: qk.customers.one(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerPayload) => customersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.customers.all }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: CustomerPayload & { id: string }) =>
      customersApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.customers.all }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: qk.customers.lists }),
        qc.invalidateQueries({ queryKey: qk.bookings.all }),
        qc.invalidateQueries({ queryKey: qk.quotes.all }),
      ]),
  });
}

export function useExportCustomer() {
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const data = await customersApi.export(id);
      downloadJson(data, `customer-${name.trim().replace(/\s+/g, "-").toLowerCase() || id}.json`);
    },
  });
}

export function useCustomerTags(id: string) {
  return useQuery({
    queryKey: qk.customers.tags(id),
    queryFn: () => customersApi.tags(id),
    enabled: !!id,
  });
}

export function useReplaceCustomerTags(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: string[]) => customersApi.replaceTags(id, tags),
    onSuccess: (tags) => qc.setQueryData(qk.customers.tags(id), tags),
  });
}
