"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api/reviews";
import { qk } from "@/lib/query/keys";

export function useBusinessReviews(slug: string, page: number) {
  return useQuery({
    queryKey: qk.public.reviews(slug, page),
    queryFn: () => reviewsApi.forBusiness(slug, page),
    placeholderData: keepPreviousData,
  });
}

export function useSubmitReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { token: string; rating: number; comment?: string }) => reviewsApi.submit(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public", "reviews", slug] }),
  });
}
