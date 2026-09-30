"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { BookingTicket } from "@/features/bookings/components/BookingTicket";
import {
  loadRawBookingSummary,
  parseBookingSummary,
  type BookingSummary,
} from "@/features/bookings/summary";

const subscribe = () => () => {};

export function BookingConfirmation({
  slug,
  bookingId,
}: {
  slug: string;
  bookingId?: string;
}) {
  const t = useTranslations("public");
  const raw = useSyncExternalStore(
    subscribe,
    () => (bookingId ? loadRawBookingSummary(bookingId) : null),
    () => null
  );
  const summary = useMemo<BookingSummary | null>(() => parseBookingSummary(raw), [raw]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-success-muted text-success-foreground">
        <svg viewBox="0 0 32 32" className="size-9" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle className="stamp-ring" cx="16" cy="16" r="13" pathLength="100" />
          <path className="stamp-check" d="M10.5 16.5l4 4 7-8" pathLength="30" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("confirmation.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {summary
          ? t("confirmation.sentTo", { email: summary.customerEmail })
          : t("confirmation.confirmed")}
      </p>

      {summary && (
        <div className="mt-8 w-full">
          <p className="mb-2 text-left text-sm font-semibold">{summary.businessName}</p>
          <BookingTicket
            serviceId={summary.serviceId}
            serviceName={summary.serviceName}
            price={summary.price}
            staffName={summary.staffName ?? t("wizard.staff.any")}
            date={summary.date}
            startTime={summary.startTime}
            endTime={summary.endTime}
          />
        </div>
      )}

      {bookingId && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t.rich("confirmation.reference", {
            code: bookingId.slice(0, 8).toUpperCase(),
            mono: (chunks) => <span className="font-mono">{chunks}</span>,
          })}
        </p>
      )}

      <Link
        href={`/b/${slug}`}
        className={buttonVariants({ variant: "outline", className: "mt-8" })}
      >
        {summary
          ? t("confirmation.backTo", { name: summary.businessName })
          : t("confirmation.backToPage")}
      </Link>
    </main>
  );
}
