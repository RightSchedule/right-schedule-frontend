"use client";

import { useTranslations } from "next-intl";
import { CalendarCheck, CalendarX, CheckCheck, TriangleAlert, UserX } from "lucide-react";
import { cn } from "cn";
import { useStatusLabel } from "@/features/bookings/components/BookingStatusBadge";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { Booking, BookingStatus } from "@/types/domain";

const BLOCK_STYLE: Record<BookingStatus, string> = {
  CONFIRMED: "border-primary/25 bg-accent/70 text-foreground",
  COMPLETED: "border-success/40 bg-success-muted text-success-foreground",
  CANCELLED: "border-destructive/30 bg-destructive/5 text-muted-foreground line-through",
  NO_SHOW: "border-warning/50 bg-warning-muted text-warning-foreground",
};

export const BLOCK_HOVER = "hover:brightness-95 dark:hover:brightness-125";

const STATUS_ICON: Record<BookingStatus, React.ElementType> = {
  CONFIRMED: CalendarCheck,
  COMPLETED: CheckCheck,
  CANCELLED: CalendarX,
  NO_SHOW: UserX,
};

const NEEDS_REVIEW_STYLE = "border-warning/60 bg-warning-muted text-warning-foreground";

export function blockStyle(b: Booking) {
  return b.needsReviewAt ? NEEDS_REVIEW_STYLE : BLOCK_STYLE[b.status];
}

function StatusMark({ booking }: { booking: Booking }) {
  const Icon = booking.needsReviewAt ? TriangleAlert : STATUS_ICON[booking.status];
  const t = useTranslations("calendar.views");
  const statusLabel = useStatusLabel();
  return (
    <>
      <Icon className="mr-1 inline size-3 shrink-0 align-[-1px]" aria-hidden />
      <span className="sr-only">
        {booking.needsReviewAt ? t("needsReview") : t("statusPrefix", { status: statusLabel(booking.status) })}{" "}
      </span>
    </>
  );
}

export function sortByStart(bookings: Booking[]) {
  return [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function BookingChip({
  booking,
  onSelect,
  showDate,
}: {
  booking: Booking;
  onSelect: (b: Booking) => void;
  showDate?: boolean;
}) {
  const t = useTranslations("calendar.views");
  const f = useLocaleFormat();
  return (
    <button
      type="button"
      onClick={() => onSelect(booking)}
      className={cn(
        "w-full rounded-md border px-2.5 py-1.5 text-left text-xs transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:py-2.5",
        blockStyle(booking),
        BLOCK_HOVER
      )}
    >
      <span className="block font-semibold">
        <StatusMark booking={booking} />
        {showDate && `${f.date(booking.date, "EEE")} `}
        <span className="font-mono">{booking.startTime.slice(0, 5)}</span> · {booking.customer?.name ?? t("customerFallback")}
      </span>
      <span className="block truncate opacity-80">
        {booking.service?.name ?? t("serviceFallback")}
        {booking.staff ? ` · ${booking.staff.name}` : ""}
      </span>
      {booking.notes && <span className="block truncate opacity-70">{booking.notes}</span>}
    </button>
  );
}

const BLOCK_ACCENT: Record<BookingStatus, string> = {
  CONFIRMED: "bg-primary",
  COMPLETED: "bg-success",
  CANCELLED: "bg-destructive/60",
  NO_SHOW: "bg-warning",
};

export function DayCard({
  booking: b,
  height,
  onSelect,
}: {
  booking: Booking;
  height: number;
  onSelect: (b: Booking) => void;
}) {
  const t = useTranslations("calendar.views");
  const statusLabel = useStatusLabel();
  const customer = b.customer?.name ?? t("customerFallback");
  const service = b.service?.name ?? t("serviceFallback");
  const start = b.startTime.slice(0, 5);
  const end = b.endTime.slice(0, 5);
  const compact = height < 36;
  const stacked = height >= 64;
  const roomy = height >= 88;
  const accent = b.needsReviewAt ? "bg-warning" : BLOCK_ACCENT[b.status];

  return (
    <button
      type="button"
      onClick={() => onSelect(b)}
      title={`${start}–${end} · ${customer} · ${service} · ${statusLabel(b.status)}`}
      className={cn(
        "group relative flex h-full w-full overflow-hidden rounded-md border text-left text-xs transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "items-center py-0.5 pl-2.5 pr-2" : "flex-col justify-center gap-0.5 py-1 pl-3 pr-2 leading-4",
        blockStyle(b),
        BLOCK_HOVER
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", accent)} />
      {compact ? (
        <span className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap">
          <StatusMark booking={b} />
          <span className="shrink-0 font-mono font-semibold">{start}</span>
          <span className="min-w-0 truncate font-semibold">{customer}</span>
          <span className="min-w-0 shrink-[3] truncate opacity-70">· {service}</span>
        </span>
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-1 font-semibold">
            <StatusMark booking={b} />
            <span className="min-w-0 truncate">{customer}</span>
          </span>
          {stacked ? (
            <>
              <span className="truncate font-mono opacity-80">
                {start} – {end}
              </span>
              <span className="truncate opacity-80">{service}</span>
            </>
          ) : (
            <span className="flex min-w-0 gap-1 whitespace-nowrap opacity-80">
              <span className="shrink-0 font-mono">{start}–{end}</span>
              <span className="min-w-0 truncate">· {service}</span>
            </span>
          )}
          {roomy && b.notes && <span className="truncate italic opacity-70">{b.notes}</span>}
        </>
      )}
    </button>
  );
}
