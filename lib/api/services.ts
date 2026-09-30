import { apiClient } from "./client";
import { listAll } from "./page";
import type { Service } from "@/types/domain";

export interface ServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

export const servicesApi = {
  list: () => listAll<Service>("/api/v1/services"),

  get: (id: string) => apiClient.get<Service>(`/api/v1/services/${id}`),

  create: (payload: ServicePayload) =>
    apiClient.post<Service>("/api/v1/services", payload),

  update: (id: string, payload: ServicePayload) =>
    apiClient.put<Service>(`/api/v1/services/${id}`, payload),

  toggle: (id: string) =>
    apiClient.patch<Service>(`/api/v1/services/${id}/toggle`, {}),

  delete: (id: string) => apiClient.delete<void>(`/api/v1/services/${id}`),
};
