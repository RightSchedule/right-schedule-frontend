"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, ClipboardCheck, Clock, CircleCheck, CircleX, Users, Plus } from "lucide-react";
import { stagger } from "@/components/ui/aurora";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared";
import { BookingStatusBadge } from "@/features/bookings/components/BookingDetailDialog";
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

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-0">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-12 min-w-[3.5rem] shrink-0 items-center justify-center rounded-2xl bg-muted px-2">
          <span className="font-mono text-sm font-bold text-foreground">
            {booking.startTime.slice(0, 5)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[0.95rem] font-semibold">{booking.customer?.name ?? "—"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {booking.service?.name ?? "—"} · {booking.staff?.name ?? "—"}
          </p>
        </div>
      </div>
      <BookingStatusBadge status={booking.status} className="shrink-0" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  index,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  index: number;
}) {
  return (
    <Card className="reveal" style={stagger(index + 1)}>
      <CardContent className="flex flex-col gap-3 p-4 pt-4 sm:p-5 sm:pt-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${color}`}>
            <Icon className="size-4" />
          </div>
        </div>
        <p className="text-4xl font-bold tabular-nums leading-none">{value}</p>
      </CardContent>
    </Card>
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

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;

  const upcoming = bookings
    .filter((b) => b.status === "CONFIRMED" && toMinutes(b.startTime) >= nowMinute)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 pt-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="reveal text-[1.6rem] font-bold leading-tight tracking-tight sm:text-3xl">
            {t(`greeting.${greetingKey(nowMinute)}`)}
          </h1>
          <p className="mt-0.5 text-[0.95rem] text-muted-foreground">
            {t("today", {
              weekday: f.date(today, "EEEE"),
              day: f.date(today, "d"),
              month: f.date(today, "MMMM"),
              year: f.date(today, "yyyy"),
            })}
          </p>
        </div>
        <Button size="lg" className="shrink-0" onClick={() => setDraft({ date: today, time: "09:00" })}>
          <Plus /> {t("new")}
        </Button>
      </div>

      {!!reviewCount && (
        <Card className="reveal mb-5 border-warning/40 bg-warning-muted" style={stagger(1)}>
          <CardContent className="flex flex-col gap-4 p-4 pt-4 sm:flex-row sm:items-center sm:p-5 sm:pt-5">
            <div className="flex min-w-0 flex-1 items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-warning-foreground">
                <ClipboardCheck className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-warning-foreground">
                  {tReview("banner.title", { count: reviewCount })}
                </p>
                <p className="mt-0.5 text-sm text-warning-foreground/80">{tReview("banner.description")}</p>
              </div>
            </div>
            <Link href="/review" className={buttonVariants({ className: "shrink-0" })}>
              {tReview("banner.cta")}
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          index={0}
          label={t("stats.total")}
          value={isLoading ? "—" : bookings.length}
          icon={CalendarDays}
          color="bg-accent text-accent-foreground"
        />
        <StatCard
          index={1}
          label={t("stats.confirmed")}
          value={isLoading ? "—" : confirmed}
          icon={Clock}
          color="bg-info-muted text-info-foreground"
        />
        <StatCard
          index={2}
          label={t("stats.completed")}
          value={isLoading ? "—" : completed}
          icon={CircleCheck}
          color="bg-success-muted text-success-foreground"
        />
        <StatCard
          index={3}
          label={t("stats.cancelled")}
          value={isLoading ? "—" : cancelled}
          icon={CircleX}
          color="bg-destructive/10 text-destructive"
        />
      </div>

      <Card className="reveal mb-5 overflow-hidden" style={stagger(5)}>
        <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4 sm:p-5">
          <CardTitle className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="size-[1.15rem] text-primary" /> {t("upcoming.title")}
          </CardTitle>
          {!isLoading && !error && (
            <Link href="/calendar" className="text-sm font-semibold text-primary hover:underline">
              {t("upcoming.count", { count: upcoming.length })}
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {error ? (
            <div className="p-4">
              <ErrorState error={error} feature={t("upcoming.feature")} onRetry={() => refetch()} />
            </div>
          ) : isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              {t("upcoming.empty")}
            </div>
          ) : (
            <div>
              {upcoming.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {business.data && (
        <div className="reveal" style={stagger(6)}>
          <BookingLinkCard slug={business.data.slug} variant="compact" />
        </div>
      )}

      <CreateBookingDialog draft={draft} onOpenChange={(o) => !o && setDraft(null)} />
    </div>
  );
}
