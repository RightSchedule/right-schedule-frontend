import { apiClient } from "./client";

export const accountApi = {
  export: () => apiClient.get<unknown>("/api/v1/account/export"),

  remove: (password: string) => apiClient.post<void>("/api/v1/account/delete", { password }),
};
