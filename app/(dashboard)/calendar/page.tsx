"use client";

import { ViewTransition, useMemo, useState } from "react";
import { addDays, addWeeks, format, subDays, subWeeks } from "date-fns";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState, PageContainer, PageHeader } from "@/components/shared";
import {
  BookingDetailDialog,
  type DialogOrigin,
} from "@/features/bookings/components/BookingDetailDialog";
import { DayView, WeekView } from "@/features/bookings/components/CalendarViews";
import {
  CreateBookingDialog,
  type BookingDraft,
} from "@/features/bookings/components/CreateBookingDialog";
import { useBookingsRange } from "@/features/bookings/hooks/useBookings";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday } from "@/lib/utils/clock";
import { dateFromISO, getWeekDays, weekRange } from "@/lib/utils/date";
import { transition } from "@/lib/utils/motion";
import type { Booking } from "@/types/domain";
import type { CalendarView } from "@/types/ui";

const DAY_FORMAT = "yyyy-MM-dd";

export default function CalendarPage() {
  const t = useTranslations("calendar.page");
  const f = useLocaleFormat();
  const [view, setView] = useState<CalendarView>("day");
  const businessQuery = useBusiness();
  const timezone = businessQuery.data?.timezone;
  const [picked, setCursor] = useState<Date | null>(null);
  const cursor = useMemo(() => picked ?? dateFromISO(businessToday(timezone)), [picked, timezone]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [origin, setOrigin] = useState<DialogOrigin | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  const weekDays = useMemo(() => getWeekDays(cursor), [cursor]);
  const staff = useStaff();
  const dayIso = format(cursor, DAY_FORMAT);
  const range = view === "day" ? { from: dayIso, to: dayIso } : weekRange(cursor);
  const bookings = useBookingsRange(range.from, range.to, { enabled: !businessQuery.isLoading });
  const error = bookings.error ?? staff.error;
  const loading = businessQuery.isLoading || bookings.isLoading || staff.isLoading;
  const retry = () => {
    if (bookings.error) bookings.refetch();
    if (staff.error) staff.refetch();
  };

  const bookingsByDay = useMemo(
    () =>
      weekDays.map((d) => {
        const iso = format(d, DAY_FORMAT);
        return (bookings.data ?? []).filter((b) => b.date === iso);
      }),
    [weekDays, bookings.data]
  );

  function step(direction: 1 | -1) {
    transition(direction === 1 ? "cal-next" : "cal-prev", () =>
      setCursor(
        view === "day"
          ? direction === 1 ? addDays(cursor, 1) : subDays(cursor, 1)
          : direction === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1)
      )
    );
  }

  function select(booking: Booking, el?: HTMLElement) {
    setOrigin(el ? { rect: el.getBoundingClientRect(), el } : null);
    setSelected(booking);
  }

  const label =
    view === "day"
      ? t("dayLabel", {
          weekday: f.date(cursor, "EEEE"),
          day: f.date(cursor, "d"),
          month: f.date(cursor, "MMMM"),
          year: f.date(cursor, "yyyy"),
        })
      : t("weekLabel", {
          start: f.date(weekDays[0]!, "d MMM"),
          end: f.date(weekDays[6]!, "d MMM yyyy"),
        });

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button size="lg" onClick={() => setDraft({ date: dayIso, time: "09:00" })}>
            <Plus /> {t("newBooking")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border">
            <Button variant="ghost" size="icon" onClick={() => step(-1)} aria-label={t("previous")}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => step(1)} aria-label={t("next")}>
              <ChevronRight />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => transition("cal-view", () => setCursor(null))}
          >
            {t("today")}
          </Button>
        </div>
        <h2 className="min-w-40 flex-1 font-heading text-xl font-semibold leading-snug" aria-live="polite">
          {label}
        </h2>
        <Tabs
          value={view}
          onValueChange={(v) => transition("cal-view", () => setView(v as CalendarView))}
        >
          <TabsList>
            <TabsTrigger value="day">{t("day")}</TabsTrigger>
            <TabsTrigger value="week">{t("week")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ViewTransition
        key={`${view}:${format(cursor, DAY_FORMAT)}`}
        enter={{
          "cal-next": "vt-in-fwd",
          "cal-prev": "vt-in-back",
          "cal-view": "vt-in-fade",
          default: "none",
        }}
        exit={{
          "cal-next": "vt-out-fwd",
          "cal-prev": "vt-out-back",
          "cal-view": "vt-out-fade",
          default: "none",
        }}
        default="none"
      >
        <div>
          {loading ? (
            <Skeleton className="h-96 rounded-lg" />
          ) : error ? (
            <ErrorState
              error={error}
              feature={t("feature")}
              onRetry={retry}
            />
          ) : view === "day" ? (
            <DayView
              date={cursor}
              timezone={timezone}
              bookings={bookings.data ?? []}
              staff={staff.data ?? []}
              onSelect={select}
              onCreate={(staffId, time) => setDraft({ date: dayIso, time, staffId })}
            />
          ) : (
            <WeekView
              timezone={timezone}
              days={weekDays}
              bookingsByDay={bookingsByDay}
              onSelect={select}
              onOpenDay={(d) =>
                transition("cal-open-day", () => {
                  setCursor(d);
                  setView("day");
                })
              }
            />
          )}
        </div>
      </ViewTransition>

      <BookingDetailDialog
        booking={selected}
        origin={origin}
        onOpenChange={(o) => !o && setSelected(null)}
      />
      <CreateBookingDialog draft={draft} onOpenChange={(o) => !o && setDraft(null)} />
    </PageContainer>
  );
}
