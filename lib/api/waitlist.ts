import { apiClient } from "./client";

export const waitlistApi = {
  leave: (token: string) =>
    apiClient.delete<void>(`/api/v1/public/waitlist/${encodeURIComponent(token)}`),
};
