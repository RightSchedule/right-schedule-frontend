import { apiClient } from "./client";
import { fetchPage } from "./page";
import type { ManagedQuote, QuoteRequest, QuoteStatus } from "@/types/domain";

export interface PublicQuoteRequest {
  businessId: string;
  serviceId?: string;
  name: string;
  email: string;
  phone?: string;
  description: string;
}

export interface QuoteReceipt {
  id: string;
  status: QuoteStatus;
  createdAt: string;
}

export const quotesApi = {
  createPublic: (payload: PublicQuoteRequest) =>
    apiClient.post<QuoteReceipt>("/api/v1/public/quote-requests", payload),

  page: (params: { status?: QuoteStatus; page?: number; size?: number }) =>
    fetchPage<QuoteRequest>("/api/v1/quote-requests", { size: 20, ...params }),

  get: (id: string) => apiClient.get<QuoteRequest>(`/api/v1/quote-requests/${id}`),

  quote: (id: string, payload: { amount: number; message?: string }) =>
    apiClient.patch<QuoteRequest>(`/api/v1/quote-requests/${id}/quote`, payload),

  getManaged: (token: string) =>
    apiClient.get<ManagedQuote>(`/api/v1/public/quote-requests/${encodeURIComponent(token)}`),

  acceptManaged: (token: string) =>
    apiClient.patch<ManagedQuote>(`/api/v1/public/quote-requests/${encodeURIComponent(token)}/accept`, {}),

  declineManaged: (token: string) =>
    apiClient.patch<ManagedQuote>(`/api/v1/public/quote-requests/${encodeURIComponent(token)}/decline`, {}),

  convert: (id: string, payload: { startDateTime: string; serviceId?: string; staffId?: string }) =>
    apiClient.patch<QuoteRequest>(`/api/v1/quote-requests/${id}/convert`, payload),

  remove: (id: string) => apiClient.delete<void>(`/api/v1/quote-requests/${id}`),

  decline: (id: string, payload: { message?: string } = {}) =>
    apiClient.patch<QuoteRequest>(`/api/v1/quote-requests/${id}/decline`, payload),
};
