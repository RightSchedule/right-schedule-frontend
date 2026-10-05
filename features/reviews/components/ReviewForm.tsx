"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { StarInput } from "@/features/reviews/components/StarRating";
import { useSubmitReview } from "@/features/reviews/hooks/useReviews";
import { useErrorMessage } from "@/lib/i18n/errors";

const COMMENT_MAX = 1000;

export function ReviewForm({ token, slug }: { token: string; slug: string }) {
  const t = useTranslations("reviews.form");
  const errorMessage = useErrorMessage();
  const submit = useSubmitReview(slug);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (submit.isSuccess) {
    return (
      <section role="status" className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6 text-center">
        <CircleCheck className="size-6 text-success-foreground" aria-hidden />
        <p className="font-semibold">{t("thanks")}</p>
      </section>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(t("ratingRequired"));
      return;
    }
    setError(null);
    try {
      await submit.mutateAsync({ token, rating, comment: comment.trim() || undefined });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{t("title")}</h2>
      <StarInput value={rating} onChange={setRating} label={t("ratingLabel")} />
      <Field label={t("comment")} htmlFor="review-comment">
        <Textarea
          id="review-comment"
          rows={3}
          maxLength={COMMENT_MAX}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Field>
      <FormError message={error} />
      <LoadingButton type="submit" loading={submit.isPending}>
        {t("submit")}
      </LoadingButton>
    </form>
  );
}
