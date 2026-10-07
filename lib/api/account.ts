import { apiClient } from "./client";
import type { AccountProfile } from "@/types/domain";

export const accountApi = {
  me: () => apiClient.get<AccountProfile>("/api/v1/account/me"),

  export: () => apiClient.get<unknown>("/api/v1/account/export"),

  remove: (password: string) => apiClient.post<void>("/api/v1/account/delete", { password }),
};
