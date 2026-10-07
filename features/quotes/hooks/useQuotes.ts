"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { quotesApi, type PublicQuoteRequest } from "@/lib/api/quotes";
import { qk } from "@/lib/query/keys";
import type { QuoteStatus } from "@/types/domain";

export function useQuotesPage(status: QuoteStatus | null, page: number) {
  return useQuery({
    queryKey: qk.quotes.list(status, page),
    queryFn: () => quotesApi.page({ status: status ?? undefined, page }),
    placeholderData: keepPreviousData,
  });
}

/** Number of unanswered requests, for badges. Only the count is needed, so fetch one row. */
export function usePendingQuotesCount() {
  return useQuery({
    queryKey: qk.quotes.pending,
    queryFn: async () => (await quotesApi.page({ status: "PENDING", size: 1 })).totalElements,
    staleTime: 60_000,
  });
}

export function useSendQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; amount: number; message?: string }) =>
      quotesApi.quote(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.quotes.all }),
  });
}

export function useDeclineQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      quotesApi.decline(id, { message }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.quotes.all }),
  });
}

export function useConvertQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; startDateTime: string; serviceId?: string; staffId?: string }) =>
      quotesApi.convert(id, payload),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: qk.quotes.all }),
        qc.invalidateQueries({ queryKey: qk.bookings.all }),
      ]),
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.quotes.all }),
  });
}

export function useManagedQuote(token: string) {
  return useQuery({
    queryKey: qk.public.managedQuote(token),
    queryFn: () => quotesApi.getManaged(token),
    retry: false,
  });
}

export function useRespondToManagedQuote(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (response: "accept" | "decline") =>
      response === "accept" ? quotesApi.acceptManaged(token) : quotesApi.declineManaged(token),
    onSuccess: (quote) => qc.setQueryData(qk.public.managedQuote(token), quote),
  });
}

export function useCreatePublicQuote() {
  return useMutation({
    mutationFn: (payload: PublicQuoteRequest) => quotesApi.createPublic(payload),
  });
}
