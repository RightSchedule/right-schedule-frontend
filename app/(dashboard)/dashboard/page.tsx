"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared";
import {
  BookingDetailDialog,
  BookingStatusBadge,
} from "@/features/bookings/components/BookingDetailDialog";
import {
  CreateBookingDialog,
  type BookingDraft,
} from "@/features/bookings/components/CreateBookingDialog";
import { BookingLinkCard } from "@/features/business/components/BookingLinkCard";
import { useBookingsRange, useReviewCount } from "@/features/bookings/hooks/useBookings";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { toMinutes } from "@/features/bookings/calendarGeometry";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessMinuteOfDay, businessToday, useBusinessMinute } from "@/lib/utils/clock";
import type { Booking } from "@/types/domain";

function greetingKey(minuteOfDay: number) {
  const h = Math.floor(minuteOfDay / 60);
  if (h < 12) return "morning" as const;
  if (h < 18) return "afternoon" as const;
  return "evening" as const;
}

function clockLabel(minuteOfDay: number) {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function NowMarker({ label, time }: { label: string; time: string }) {
  return (
    <li aria-label={`${label} ${time}`} className="flex items-center gap-3 py-1">
      <span className="w-14 shrink-0 text-right font-mono text-xs font-medium text-primary">{time}</span>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
      <span aria-hidden className="h-px flex-1 bg-primary/60" />
      <span className="text-xs font-medium text-primary">{label}</span>
    </li>
  );
}

function TimelineRow({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  const closed = booking.status !== "CONFIRMED";
  return (
    <li className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      >
        <span className="w-14 shrink-0 text-right">
          <span className={cn("block font-mono text-sm font-medium", closed && "text-muted-foreground")}>
            {booking.startTime.slice(0, 5)}
          </span>
          <span className="block font-mono text-xs text-muted-foreground">{booking.endTime.slice(0, 5)}</span>
        </span>
        <span aria-hidden className="mt-1.5 h-4 w-px shrink-0 bg-border" />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate font-medium",
              booking.status === "CANCELLED" && "text-muted-foreground line-through"
            )}
          >
            {booking.customer?.name ?? "—"}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {booking.service?.name ?? "—"} · {booking.staff?.name ?? "—"}
          </span>
        </span>
        <BookingStatusBadge status={booking.status} className="shrink-0" />
      </button>
    </li>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tReview = useTranslations("review");
  const { data: reviewCount } = useReviewCount();
  const f = useLocaleFormat();
  const business = useBusiness();
  const timezone = business.data?.timezone;
  const today = businessToday(timezone);
  const nowMinute = useBusinessMinute(timezone, true) ?? businessMinuteOfDay(timezone);

  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    error,
    refetch,
  } = useBookingsRange(today, today, { enabled: !business.isLoading });
  const isLoading = business.isLoading || bookingsLoading;
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);

  const count = (status: Booking["status"]) => bookings.filter((b) => b.status === status).length;
  const summary = [
    { key: "total", value: bookings.length },
    { key: "confirmed", value: count("CONFIRMED") },
    { key: "completed", value: count("COMPLETED") },
    { key: "cancelled", value: count("CANCELLED") },
  ] as const;

  const sorted = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nowIndex = sorted.findIndex((b) => toMinutes(b.startTime) >= nowMinute);
  const markerAt = nowIndex === -1 ? sorted.length : nowIndex;
  const hasUpcoming = sorted.some((b) => b.status === "CONFIRMED" && toMinutes(b.startTime) >= nowMinute);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 pt-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold leading-tight">{t(`greeting.${greetingKey(nowMinute)}`)}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("today", {
              weekday: f.date(today, "EEEE"),
              day: f.date(today, "d"),
              month: f.date(today, "MMMM"),
              year: f.date(today, "yyyy"),
            })}
          </p>
        </div>
        <Button className="shrink-0" onClick={() => setDraft({ date: today, time: "09:00" })}>
          <Plus /> {t("new")}
        </Button>
      </div>

      {!!reviewCount && (
        <div className="mb-6 flex flex-col gap-2 rounded-md border-l-4 border-warning bg-warning-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="font-medium text-warning-foreground">{tReview("banner.title", { count: reviewCount })}</p>
            <p className="text-sm text-warning-foreground/80">{tReview("banner.description")}</p>
          </div>
          <Link
            href="/review"
            className="shrink-0 text-sm font-semibold text-warning-foreground underline underline-offset-4 hover:no-underline"
          >
            {tReview("banner.cta")}
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-labelledby="timeline-title">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-3">
            <h2 id="timeline-title" className="text-xl font-semibold">
              {t("timeline.title")}
            </h2>
            {!isLoading && !error && (
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {summary.map((s) => (
                  <div key={s.key} className="flex gap-1.5">
                    <dd className="font-semibold tabular-nums text-foreground">{s.value}</dd>
                    <dt>{t(`stats.${s.key}`)}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {error ? (
            <div className="pt-4">
              <ErrorState error={error} feature={t("timeline.feature")} onRetry={() => refetch()} />
            </div>
          ) : isLoading ? (
            <div className="flex flex-col gap-3 pt-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-12 text-muted-foreground">{t("timeline.empty")}</p>
          ) : (
            <>
              <ol>
                {sorted.map((b, i) => (
                  <Fragment key={b.id}>
                    {i === markerAt && <NowMarker label={t("timeline.now")} time={clockLabel(nowMinute)} />}
                    <TimelineRow booking={b} onOpen={() => setSelected(b)} />
                  </Fragment>
                ))}
                {markerAt === sorted.length && <NowMarker label={t("timeline.now")} time={clockLabel(nowMinute)} />}
              </ol>
              {!hasUpcoming && <p className="pt-4 text-sm text-muted-foreground">{t("timeline.allDone")}</p>}
            </>
          )}
        </section>

        {business.data && (
          <aside className="lg:pt-1">
            <BookingLinkCard slug={business.data.slug} variant="compact" />
          </aside>
        )}
      </div>

      <BookingDetailDialog booking={selected} onOpenChange={(o) => !o && setSelected(null)} />
      <CreateBookingDialog draft={draft} onOpenChange={(o) => !o && setDraft(null)} />
    </div>
  );
}
