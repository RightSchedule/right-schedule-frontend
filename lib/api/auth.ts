import { apiClient } from "./client";
import type { AuthResponse, RegisterResponse } from "@/types/api";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", { email, password }),

  register: (email: string, password: string) =>
    apiClient.post<RegisterResponse>("/api/v1/auth/register", { email, password }),
};
