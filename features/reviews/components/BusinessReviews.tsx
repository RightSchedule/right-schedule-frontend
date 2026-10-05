"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StarsDisplay } from "@/features/reviews/components/StarRating";
import { useBusinessReviews } from "@/features/reviews/hooks/useReviews";
import { useLocaleFormat } from "@/lib/i18n/format";

export function BusinessReviews({ slug }: { slug: string }) {
  const t = useTranslations("reviews");
  const f = useLocaleFormat();
  const [page, setPage] = useState(0);
  const { data, isPlaceholderData } = useBusinessReviews(slug, page);

  if (!data || data.totalReviews === 0) return null;
  const { reviews } = data;

  return (
    <section aria-labelledby="reviews-heading" className="mt-10">
      <h2 id="reviews-heading" className="mb-2 font-sans text-sm font-semibold text-muted-foreground">
        {t("heading")}
      </h2>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl font-semibold">{data.averageRating.toFixed(1)}</span>
        <StarsDisplay value={data.averageRating} />
        <span className="text-sm text-muted-foreground">{t("count", { count: data.totalReviews })}</span>
      </div>
      <ul className="flex flex-col">
        {reviews.content.map((r) => (
          <li key={r.id} className="border-t border-border py-4 first:border-t-0">
            <div className="flex items-center gap-2">
              <StarsDisplay value={r.rating} />
              <span className="text-sm font-medium">{r.customerName}</span>
              <span className="text-xs text-muted-foreground">{f.date(r.createdAt, "d MMM yyyy")}</span>
            </div>
            {r.comment && <p className="mt-1.5 whitespace-pre-wrap break-words text-sm">{r.comment}</p>}
          </li>
        ))}
      </ul>
      {reviews.totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <Button variant="outline" disabled={page === 0 || isPlaceholderData} onClick={() => setPage((p) => p - 1)}>
            {t("previous")}
          </Button>
          <span className="text-xs text-muted-foreground">{t("page", { page: page + 1, total: reviews.totalPages })}</span>
          <Button
            variant="outline"
            disabled={page + 1 >= reviews.totalPages || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </section>
  );
}
