"use client";

import { ViewTransition } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { CalendarX } from "lucide-react";
import { cn } from "cn";
import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import { HOUR_PX, bookingMinutes, bookingTotal, snapOffsetToTime, toMinutes } from "@/features/bookings/calendarGeometry";
import { openWindow, visibleHours, type MinuteRange, type StaffDayHours } from "@/features/bookings/calendarHours";
import { layoutLanes, laneStyle } from "@/features/bookings/calendarLanes";
import { OffHours, useSlotCursor } from "@/features/bookings/components/SlotCursor";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday, useBusinessMinute } from "@/lib/utils/clock";
import type { Booking, Staff } from "@/types/domain";
import { BLOCK_HOVER, blockStyle, sortByStart, BookingChip, DayCard } from "@/features/bookings/components/CalendarBlocks";

type Column = { id: string; name: string; active: boolean };

const MOBILE_BLOCK_MIN_PX = 48;
const DESKTOP_BLOCK_MIN_PX = 28;
const DESKTOP_MAX_LANES = 3;
const MOBILE_MAX_LANES = 2;

/** Cancelled and no-show bookings are history: they sit underneath instead of taking a lane. */
const isClosed = (b: Booking) => b.status === "CANCELLED" || b.status === "NO_SHOW";

/** A closed booking drawn under a live one is faded so its text does not bleed through. */
function fadedUnder(b: Booking, all: Booking[]) {
  if (!isClosed(b)) return false;
  const start = toMinutes(b.startTime);
  const end = toMinutes(b.endTime);
  return all.some((o) => !isClosed(o) && toMinutes(o.startTime) < end && start < toMinutes(o.endTime));
}


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
  nowMinute,
  working,
  onSelect,
  onCreate,
}: {
  column: Column;
  bookings: Booking[];
  hours: number[];
  firstHour: number;
  nowTop: number | null;
  nowMinute: number | null;
  working: MinuteRange[] | undefined;
  onSelect: (b: Booking) => void;
  onCreate?: CreateHandler;
}) {
  const t = useTranslations("calendar.views");
  const tPeople = useTranslations("public.service");
  const f = useLocaleFormat();
  const creatable = !!onCreate && column.id !== "__other";
  const height = hours.length * HOUR_PX;
  const lanes = layoutLanes(
    bookings
      .filter((b) => !isClosed(b))
      .map((b) => ({ id: b.id, start: toMinutes(b.startTime), end: toMinutes(b.endTime) })),
    (MOBILE_BLOCK_MIN_PX / HOUR_PX) * 60,
    MOBILE_MAX_LANES
  );
  const { surfaceProps, overlay } = useSlotCursor({
    firstHour,
    lastHour: firstHour + hours.length,
    nowMinute,
    enabled: creatable,
    label: t("columnLabel", { name: column.name }),
    onCreate: (time) => onCreate?.(column.id, time),
  });

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
          className={cn(
            "relative flex-1",
            creatable &&
              "cursor-cell focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          )}
          style={{ height, backgroundImage: hourBackground() }}
          onClick={(e) => {
            if (!creatable || e.target !== e.currentTarget) return;
            const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
            onCreate(column.id, snapOffsetToTime(offset, firstHour));
          }}
          {...surfaceProps}
        >
          <OffHours working={working} firstHour={firstHour} lastHour={firstHour + hours.length} />
          {overlay}
          {nowTop !== null && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-10 h-px bg-primary"
              style={{ top: nowTop }}
            />
          )}
          {[...sortByStart(bookings)].sort((a, b) => Number(!isClosed(a)) - Number(!isClosed(b))).map((b) => {
            const start = toMinutes(b.startTime);
            const end = toMinutes(b.endTime);
            const top = ((start - firstHour * 60) / 60) * HOUR_PX;
            const blockHeight = Math.max(((end - start) / 60) * HOUR_PX - 4, MOBILE_BLOCK_MIN_PX);
            const placement = lanes.get(b.id);
            const shared = (placement?.lanes ?? 1) > 1;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelect(b)}
                style={{ top, minHeight: blockHeight, ...laneStyle(placement) }}
                className={cn(
                  "absolute flex flex-col justify-center gap-0.5 overflow-hidden rounded-md border px-3 py-1.5 text-left transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  fadedUnder(b, bookings) && "opacity-40",
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
                  <BookingStatusBadge status={b.status} className={shared ? "sr-only" : "shrink-0"} />
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

/** Mobile-only staff filter. `null` means auto: everyone for a small team, the first member otherwise. */
export type MobileStaffPick = string | null;
const ALL_STAFF = "__all";

export function DayView({
  date,
  timezone,
  bookings,
  staff,
  onSelect,
  onCreate,
  dayHours,
  mobileStaff = null,
  onMobileStaffChange,
}: {
  date: Date;
  timezone?: string;
  bookings: Booking[];
  staff: Staff[];
  onSelect: (b: Booking) => void;
  onCreate?: CreateHandler;
  /** Working ranges per staff for this weekday; leave out while unknown. */
  dayHours?: StaffDayHours;
  mobileStaff?: MobileStaffPick;
  onMobileStaffChange?: (id: string) => void;
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
          dayHours={dayHours}
          mobileStaff={mobileStaff}
          onMobileStaffChange={onMobileStaffChange}
        />
      </div>
    </ViewTransition>
  );
}

function StaffPicker({
  columns,
  bookings,
  value,
  onChange,
}: {
  columns: Column[];
  bookings: Booking[];
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useTranslations("calendar.views");
  const options = [
    { id: ALL_STAFF, label: t("allStaff"), count: bookings.length },
    ...columns.map((c) => ({
      id: c.id,
      label: c.name,
      count: bookings.filter((b) => (c.id === "__other" ? !columns.some((o) => o.id === b.staffId) : b.staffId === c.id)).length,
    })),
  ];
  return (
    <div role="group" aria-label={t("staffFilter")} className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.id
              ? "border-primary bg-primary/10 font-semibold text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {o.label}
          <span className="font-mono text-xs tabular-nums opacity-80">{o.count}</span>
        </button>
      ))}
    </div>
  );
}

function DesktopColumn({
  column,
  bookings,
  hours,
  firstHour,
  nowTop,
  nowMinute,
  working,
  onSelect,
  onCreate,
}: {
  column: Column;
  bookings: Booking[];
  hours: number[];
  firstHour: number;
  nowTop: number | null;
  nowMinute: number | null;
  working: MinuteRange[] | undefined;
  onSelect: (b: Booking) => void;
  onCreate?: CreateHandler;
}) {
  const t = useTranslations("calendar.views");
  const creatable = !!onCreate && column.id !== "__other";
  const { surfaceProps, overlay } = useSlotCursor({
    firstHour,
    lastHour: firstHour + hours.length,
    nowMinute,
    enabled: creatable,
    label: t("columnLabel", { name: column.name }),
    onCreate: (time) => onCreate?.(column.id, time),
  });
  const mine = [...bookings].sort((a, b) => Number(a.status === "CONFIRMED") - Number(b.status === "CONFIRMED"));
  const lanes = layoutLanes(
    bookings
      .filter((b) => !isClosed(b))
      .map((b) => ({ id: b.id, start: toMinutes(b.startTime), end: toMinutes(b.endTime) })),
    (DESKTOP_BLOCK_MIN_PX / HOUR_PX) * 60,
    DESKTOP_MAX_LANES
  );

  return (
    <div
      className={cn(
        "relative border-l border-border",
        creatable &&
          "cursor-cell focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      )}
      onClick={(e) => {
        if (!creatable || e.target !== e.currentTarget) return;
        const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
        onCreate(column.id, snapOffsetToTime(offset, firstHour));
      }}
      style={{
        height: hours.length * HOUR_PX,
        backgroundImage: hourBackground(),
      }}
      {...surfaceProps}
    >
      <OffHours working={working} firstHour={firstHour} lastHour={firstHour + hours.length} />
      {overlay}
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
        const height = Math.max(((end - start) / 60) * HOUR_PX - 2, DESKTOP_BLOCK_MIN_PX);
        return (
          <div
            key={b.id}
            className={cn("absolute", fadedUnder(b, bookings) && "opacity-40")}
            style={{ top, height, ...laneStyle(lanes.get(b.id)) }}
          >
            <DayCard booking={b} height={height} onSelect={onSelect} />
          </div>
        );
      })}
    </div>
  );
}

function DayGrid({
  bookings,
  staff,
  onSelect,
  onCreate,
  nowMinute,
  dayHours,
  mobileStaff,
  onMobileStaffChange,
}: {
  bookings: Booking[];
  staff: Staff[];
  onSelect: (b: Booking) => void;
  onCreate?: CreateHandler;
  nowMinute: number | null;
  dayHours?: StaffDayHours;
  mobileStaff: MobileStaffPick;
  onMobileStaffChange?: (id: string) => void;
}) {
  const t = useTranslations("calendar.views");
  const staffIds = new Set(staff.map((s) => s.id));
  const columns: Column[] = staff
    .filter((s) => s.active || bookings.some((b) => b.staffId === s.id))
    .map((s) => ({ id: s.id, name: s.name, active: s.active }));
  if (bookings.some((b) => !staffIds.has(b.staffId))) {
    columns.push({ id: "__other", name: t("other"), active: true });
  }
  const bookingsOf = (c: Column) =>
    bookings.filter((b) => (c.id === "__other" ? !staffIds.has(b.staffId) : b.staffId === c.id));

  const window = dayHours
    ? openWindow(
        dayHours,
        columns.filter((c) => c.active).map((c) => c.id)
      )
    : null;
  const { firstHour, lastHour } = visibleHours(bookings, window);
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);

  const nowTop =
    nowMinute !== null && nowMinute >= firstHour * 60 && nowMinute <= lastHour * 60
      ? ((nowMinute - firstHour * 60) / 60) * HOUR_PX
      : null;

  const busy = (c: Column) => bookingsOf(c).length > 0;
  const autoPick =
    columns.length > 2
      ? (columns.find((c) => c.active && busy(c)) ?? columns.find(busy) ?? columns[0]!).id
      : ALL_STAFF;
  const picked =
    mobileStaff && (mobileStaff === ALL_STAFF || columns.some((c) => c.id === mobileStaff))
      ? mobileStaff
      : autoPick;
  const mobileColumns = picked === ALL_STAFF ? columns : columns.filter((c) => c.id === picked);

  return (
    <>
      <div className="flex flex-col gap-4 md:hidden">
        {columns.length > 1 && onMobileStaffChange && (
          <StaffPicker columns={columns} bookings={bookings} value={picked} onChange={onMobileStaffChange} />
        )}
        {columns.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          mobileColumns.map((c) => (
            <StaffTimeline
              key={c.id}
              column={c}
              bookings={bookingsOf(c)}
              hours={hours}
              firstHour={firstHour}
              nowTop={nowTop}
              nowMinute={nowMinute}
              working={dayHours?.[c.id]}
              onSelect={onSelect}
              onCreate={onCreate}
            />
          ))
        )}
      </div>

      <div className="hidden rounded-lg border border-border bg-card md:block">
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

          {columns.map((c) => (
            <DesktopColumn
              key={c.id}
              column={c}
              bookings={bookingsOf(c)}
              hours={hours}
              firstHour={firstHour}
              nowTop={nowTop}
              nowMinute={nowMinute}
              working={dayHours?.[c.id]}
              onSelect={onSelect}
              onCreate={onCreate}
            />
          ))}
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
  onSelect: (b: Booking) => void;
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
