"use client";

import { ViewTransition } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { CalendarCheck, CalendarX, CheckCheck, TriangleAlert, UserX } from "lucide-react";
import { cn } from "cn";
import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge, useStatusLabel } from "@/features/bookings/components/BookingStatusBadge";
import {
  HOUR_PX,
  bookingMinutes,
  bookingTotal,
  snapOffsetToTime,
  toMinutes,
} from "@/features/bookings/calendarGeometry";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday, useBusinessMinute } from "@/lib/utils/clock";
import type { Booking, BookingStatus, Staff } from "@/types/domain";

const BLOCK_STYLE: Record<BookingStatus, string> = {
  CONFIRMED: "border-primary/25 bg-accent/70 text-foreground",
  COMPLETED: "border-success/40 bg-success-muted text-success-foreground",
  CANCELLED: "border-destructive/30 bg-destructive/5 text-muted-foreground line-through",
  NO_SHOW: "border-warning/50 bg-warning-muted text-warning-foreground",
};

const BLOCK_HOVER = "hover:brightness-95 dark:hover:brightness-125";

const STATUS_ICON: Record<BookingStatus, React.ElementType> = {
  CONFIRMED: CalendarCheck,
  COMPLETED: CheckCheck,
  CANCELLED: CalendarX,
  NO_SHOW: UserX,
};

const NEEDS_REVIEW_STYLE = "border-warning/60 bg-warning-muted text-warning-foreground";

function blockStyle(b: Booking) {
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

function sortByStart(bookings: Booking[]) {
  return [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function BookingChip({
  booking,
  onSelect,
  showDate,
}: {
  booking: Booking;
  onSelect: (b: Booking, origin?: HTMLElement) => void;
  showDate?: boolean;
}) {
  const t = useTranslations("calendar.views");
  const f = useLocaleFormat();
  return (
    <button
      type="button"
      onClick={(e) => onSelect(booking, e.currentTarget)}
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

function DayCard({
  booking: b,
  height,
  onSelect,
}: {
  booking: Booking;
  height: number;
  onSelect: (b: Booking, origin?: HTMLElement) => void;
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
      onClick={(e) => onSelect(b, e.currentTarget)}
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

type Column = { id: string; name: string; active: boolean };

function hourBackground() {
  return (
    "repeating-linear-gradient(to bottom, transparent 0, transparent calc(" +
    HOUR_PX +
    "px - 1px), var(--border) calc(" +
    HOUR_PX +
    "px - 1px), var(--border) " +
    HOUR_PX +
    "px)"
  );
}

function StaffTimeline({
  column,
  bookings,
  hours,
  firstHour,
  nowTop,
  onSelect,
  onCreate,
}: {
  column: Column;
  bookings: Booking[];
  hours: number[];
  firstHour: number;
  nowTop: number | null;
  onSelect: (b: Booking, origin?: HTMLElement) => void;
  onCreate?: CreateHandler;
}) {
  const t = useTranslations("calendar.views");
  const tPeople = useTranslations("public.service");
  const f = useLocaleFormat();
  const creatable = !!onCreate && column.id !== "__other";
  const height = hours.length * HOUR_PX;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <span className="truncate font-heading text-lg font-semibold">{column.name}</span>
        <Badge variant={column.active ? "success" : "secondary"}>
          {column.active ? t("active") : t("inactive")}
        </Badge>
        <span className="ml-auto shrink-0 text-sm text-muted-foreground">
          {t("bookingsCount", { count: bookings.length })}
        </span>
      </header>

      <div className="flex px-4 py-3">
        <div className="relative w-14 shrink-0" style={{ height }}>
          {hours.map((h, i) => (
            <span
              key={h}
              className="absolute left-0 -translate-y-1/2 font-mono text-xs text-muted-foreground"
              style={{ top: i * HOUR_PX + (i === 0 ? 8 : 0) }}
            >
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>
        <div
          className={cn("relative flex-1", creatable && "cursor-cell")}
          style={{ height, backgroundImage: hourBackground() }}
          onClick={(e) => {
            if (!creatable || e.target !== e.currentTarget) return;
            const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
            onCreate(column.id, snapOffsetToTime(offset, firstHour));
          }}
        >
          {nowTop !== null && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-10 h-px bg-primary"
              style={{ top: nowTop }}
            />
          )}
          {sortByStart(bookings).map((b) => {
            const start = toMinutes(b.startTime);
            const end = toMinutes(b.endTime);
            const top = ((start - firstHour * 60) / 60) * HOUR_PX;
            const blockHeight = Math.max(((end - start) / 60) * HOUR_PX - 4, 48);
            return (
              <button
                key={b.id}
                type="button"
                onClick={(e) => onSelect(b, e.currentTarget)}
                style={{ top, minHeight: blockHeight }}
                className={cn(
                  "absolute inset-x-1 flex flex-col justify-center gap-0.5 overflow-hidden rounded-md border px-3 py-1.5 text-left transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  blockStyle(b),
                  BLOCK_HOVER
                )}
              >
                <span className="flex items-start gap-2 text-sm font-semibold">
                  <span className="min-w-0 flex-1">
                    <span className="font-mono">
                      {b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}
                    </span>{" "}
                    · {b.customer?.name ?? t("customerFallback")}
                  </span>
                  <BookingStatusBadge status={b.status} className="shrink-0" />
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {b.service?.name ?? t("serviceFallback")}
                  {b.service &&
                    ` · ${t("summary", {
                      minutes: bookingMinutes(b),
                      price: f.price(bookingTotal(b) ?? b.service.price),
                    })}`}
                  {(b.partySize ?? 1) > 1 && ` · ${tPeople("people", { count: b.partySize! })}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export type CreateHandler = (staffId: string, time: string) => void;

export function DayView({
  date,
  timezone,
  bookings,
  staff,
  onSelect,
  onCreate,
}: {
  date: Date;
  timezone?: string;
  bookings: Booking[];
  staff: Staff[];
  onSelect: (b: Booking, origin?: HTMLElement) => void;
  onCreate?: CreateHandler;
}) {
  const iso = format(date, "yyyy-MM-dd");
  const nowMinute = useBusinessMinute(timezone, iso === businessToday(timezone));

  return (
    <ViewTransition name={`cal-day-${iso}`} share="vt-morph" default="none">
      <div>
        <DayGrid
          bookings={bookings}
          staff={staff}
          onSelect={onSelect}
          onCreate={onCreate}
          nowMinute={nowMinute}
        />
      </div>
    </ViewTransition>
  );
}

function DayGrid({
  bookings,
  staff,
  onSelect,
  onCreate,
  nowMinute,
}: {
  bookings: Booking[];
  staff: Staff[];
  onSelect: (b: Booking, origin?: HTMLElement) => void;
  onCreate?: CreateHandler;
  nowMinute: number | null;
}) {
  const t = useTranslations("calendar.views");
  const starts = bookings.map((b) => toMinutes(b.startTime));
  const ends = bookings.map((b) => toMinutes(b.endTime));
  const firstHour = Math.min(8, Math.floor(Math.min(...starts, 8 * 60) / 60));
  const lastHour = Math.min(24, Math.max(19, Math.ceil(Math.max(...ends, 0) / 60)));
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);

  const staffIds = new Set(staff.map((s) => s.id));
  const columns: Column[] = staff
    .filter((s) => s.active || bookings.some((b) => b.staffId === s.id))
    .map((s) => ({ id: s.id, name: s.name, active: s.active }));
  if (bookings.some((b) => !staffIds.has(b.staffId))) {
    columns.push({ id: "__other", name: t("other"), active: true });
  }
  const bookingsOf = (c: Column) =>
    bookings.filter((b) => (c.id === "__other" ? !staffIds.has(b.staffId) : b.staffId === c.id));

  const nowTop =
    nowMinute !== null && nowMinute >= firstHour * 60 && nowMinute <= lastHour * 60
      ? ((nowMinute - firstHour * 60) / 60) * HOUR_PX
      : null;

  return (
    <>
      <div className="flex flex-col gap-4 md:hidden">
        {columns.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          columns.map((c) => (
            <StaffTimeline
              key={c.id}
              column={c}
              bookings={bookingsOf(c)}
              hours={hours}
              firstHour={firstHour}
              nowTop={nowTop}
              onSelect={onSelect}
              onCreate={onCreate}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <div
          className="grid min-w-[36rem]"
          style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(9rem, 1fr))` }}
        >
          <div className="sticky top-0 z-10 border-b border-border bg-card" />
          {columns.map((c) => (
            <div
              key={c.id}
              className="sticky top-0 z-10 truncate border-b border-l border-border bg-card px-3 py-2 font-heading font-semibold"
            >
              {c.name}
            </div>
          ))}

          <div className="relative" style={{ height: hours.length * HOUR_PX }}>
            {hours.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 font-mono text-xs text-muted-foreground"
                style={{ top: i * HOUR_PX, display: i === 0 ? "none" : undefined }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
            {nowTop !== null && (
              <span
                aria-hidden
                className="now-dot absolute right-0 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary transition-[top] duration-1000 ease-linear"
                style={{ top: nowTop }}
              />
            )}
          </div>

          {columns.map((c) => {
            const mine = bookingsOf(c).sort((a, b) => Number(a.status === "CONFIRMED") - Number(b.status === "CONFIRMED"));
            return (
              <div
                key={c.id}
                className={cn("relative border-l border-border", onCreate && c.id !== "__other" && "cursor-cell")}
                onClick={(e) => {
                  if (!onCreate || c.id === "__other" || e.target !== e.currentTarget) return;
                  const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
                  onCreate(c.id, snapOffsetToTime(offset, firstHour));
                }}
                style={{
                  height: hours.length * HOUR_PX,
                  backgroundImage: hourBackground(),
                }}
              >
                {nowTop !== null && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 h-px bg-primary transition-[top] duration-1000 ease-linear"
                    style={{ top: nowTop }}
                  />
                )}
                {mine.map((b) => {
                  const start = toMinutes(b.startTime);
                  const end = toMinutes(b.endTime);
                  const top = ((start - firstHour * 60) / 60) * HOUR_PX;
                  const height = Math.max(((end - start) / 60) * HOUR_PX - 2, 28);
                  return (
                    <div key={b.id} className="absolute inset-x-1" style={{ top, height }}>
                      <DayCard booking={b} height={height} onSelect={onSelect} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function WeekView({
  timezone,
  days,
  bookingsByDay,
  onSelect,
  onOpenDay,
}: {
  timezone?: string;
  days: Date[];
  bookingsByDay: Booking[][];
  onSelect: (b: Booking, origin?: HTMLElement) => void;
  onOpenDay: (d: Date) => void;
}) {
  const today = businessToday(timezone);
  const t = useTranslations("calendar.views");
  const f = useLocaleFormat();
  return (
    <div className="grid gap-4 md:grid-cols-7 md:gap-3">
      {days.map((day, i) => {
        const list = sortByStart(bookingsByDay[i] ?? []);
        const isToday = format(day, "yyyy-MM-dd") === today;
        return (
          <ViewTransition
            key={day.toISOString()}
            name={`cal-day-${format(day, "yyyy-MM-dd")}`}
            share="vt-morph"
            default="none"
          >
          <section
            className={cn(
              "flex min-h-28 flex-col gap-2 rounded-lg border border-border bg-card p-4 md:p-2.5",
              isToday && "border-primary"
            )}
          >
            <button
              type="button"
              onClick={() => onOpenDay(day)}
              className="flex items-baseline justify-between border-b border-border pb-3 text-left md:pb-2"
              aria-label={t("openDay", {
                weekday: f.date(day, "EEEE"),
                day: f.date(day, "d"),
                month: f.date(day, "MMMM"),
              })}
            >
              <span className="text-sm font-medium text-muted-foreground md:text-xs">
                {f.date(day, "EEE")}
              </span>
              <span
                className={cn(
                  "text-xl font-semibold md:text-sm",
                  isToday && "text-primary"
                )}
              >
                {format(day, "d")}
              </span>
            </button>
            {list.length === 0 ? (
              <p className="flex flex-1 items-center justify-center py-6 text-sm text-muted-foreground md:py-0 md:text-xs">—</p>
            ) : (
              list.map((b) => <BookingChip key={b.id} booking={b} onSelect={onSelect} />)
            )}
          </section>
          </ViewTransition>
        );
      })}
    </div>
  );
}
