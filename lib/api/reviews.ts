import { apiClient } from "./client";
import type { BusinessReviews, Review } from "@/types/domain";

export const reviewsApi = {
  submit: (payload: { token: string; rating: number; comment?: string }) =>
    apiClient.post<Review>("/api/v1/public/reviews", payload),

  forBusiness: (slug: string, page = 0) =>
    apiClient.get<BusinessReviews>(
      `/api/v1/public/businesses/${encodeURIComponent(slug)}/reviews?page=${page}&size=10`
    ),
};
