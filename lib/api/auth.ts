import { apiClient, requestLogout } from "./client";
import type { AuthResponse, RegisterResponse } from "@/types/api";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", { email, password }),

  register: (email: string, password: string, termsVersion: string) =>
    apiClient.post<RegisterResponse>("/api/v1/auth/register", {
      email,
      password,
      termsAccepted: true,
      termsVersion,
    }),

  verifyEmail: (token: string) =>
    apiClient.post<void>("/api/v1/auth/verify-email", { token }),

  resendVerification: (email: string) =>
    apiClient.post<void>("/api/v1/auth/resend-verification", { email }),

  forgotPassword: (email: string) =>
    apiClient.post<void>("/api/v1/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<void>("/api/v1/auth/reset-password", { token, newPassword }),

  logout: requestLogout,
};
