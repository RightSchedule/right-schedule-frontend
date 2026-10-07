import { apiClient } from "./client";
import { fetchPage } from "./page";
import type { Customer } from "@/types/domain";

export interface CustomerPayload {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export const customersApi = {
  page: (params: { search?: string; page?: number; size?: number }) =>
    fetchPage<Customer>("/api/v1/customers", { size: 20, ...params }),

  get: (id: string) => apiClient.get<Customer>(`/api/v1/customers/${id}`),

  create: (payload: CustomerPayload) =>
    apiClient.post<Customer>("/api/v1/customers", payload),

  update: (id: string, payload: CustomerPayload) =>
    apiClient.put<Customer>(`/api/v1/customers/${id}`, payload),

  remove: (id: string) => apiClient.delete<void>(`/api/v1/customers/${id}`),

  tags: (id: string) =>
    apiClient.get<{ tags: string[] }>(`/api/v1/customers/${id}/tags`).then((r) => r.tags),

  replaceTags: (id: string, tags: string[]) =>
    apiClient.put<{ tags: string[] }>(`/api/v1/customers/${id}/tags`, { tags }).then((r) => r.tags),

  export: (id: string) => apiClient.get<unknown>(`/api/v1/customers/${id}/export`),
};
