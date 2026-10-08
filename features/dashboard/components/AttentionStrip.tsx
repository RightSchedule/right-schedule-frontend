"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useReviewCount } from "@/features/bookings/hooks/useBookings";
import { usePendingQuotesCount } from "@/features/quotes/hooks/useQuotes";
import { useWaitingCount } from "@/features/waitlist/hooks/useWaitlist";

/** Everything waiting on the owner, in one place. Renders nothing when the queues are empty. */
export function AttentionStrip() {
  const t = useTranslations("dashboard.attention");
  const tReview = useTranslations("review.banner");
  const { data: review } = useReviewCount();
  const { data: quotes } = usePendingQuotesCount();
  const { data: waiting } = useWaitingCount();

  const items = [
    review
      ? {
          key: "review",
          href: "/review",
          title: tReview("title", { count: review }),
          detail: tReview("description"),
          cta: tReview("cta"),
        }
      : null,
    quotes
      ? {
          key: "quotes",
          href: "/quotes",
          title: t("quotes", { count: quotes }),
          cta: t("quotesCta"),
        }
      : null,
    waiting
      ? {
          key: "waitlist",
          href: "/waitlist",
          title: t("waitlist", { count: waiting }),
          cta: t("waitlistCta"),
        }
      : null,
  ].filter((item) => item !== null);

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="attention-title"
      className="mb-6 rounded-md border-l-4 border-warning bg-warning-muted px-4 py-3"
    >
      <h2
        id="attention-title"
        className="text-sm font-semibold uppercase tracking-wide text-warning-foreground/80"
      >
        {t("title")}
      </h2>
      <ul className="mt-1 divide-y divide-warning-foreground/15">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-warning-foreground">{item.title}</p>
              {"detail" in item && (
                <p className="text-sm text-warning-foreground/80">{item.detail}</p>
              )}
            </div>
            <Link
              href={item.href}
              className="shrink-0 text-sm font-semibold text-warning-foreground underline underline-offset-4 hover:no-underline"
            >
              {item.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
