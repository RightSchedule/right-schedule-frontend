import { apiClient } from "./client";
import { fetchPage } from "./page";
import type { WaitlistEntry, WaitlistStatus } from "@/types/domain";

export const waitlistApi = {
  page: (params: { status?: WaitlistStatus; page?: number; size?: number }) =>
    fetchPage<WaitlistEntry>("/api/v1/waitlist", { size: 20, ...params }),

  remove: (id: string) => apiClient.delete<WaitlistEntry>(`/api/v1/waitlist/${id}`),

  leave: (token: string) =>
    apiClient.delete<void>(`/api/v1/public/waitlist/${encodeURIComponent(token)}`),
};
