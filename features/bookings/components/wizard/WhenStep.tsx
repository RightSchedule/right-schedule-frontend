"use client";

import { ViewTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { addDays, format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared";
import { useAvailability } from "@/features/bookings/hooks/useAvailability";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday } from "@/lib/utils/clock";
import { dateFromISO } from "@/lib/utils/date";
import { transition } from "@/lib/utils/motion";

type PartOfDay = "morning" | "afternoon" | "evening";

function partOfDay(time: string): PartOfDay {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function WhenStep({
  slug,
  timezone,
  serviceId,
  partySize,
  staffId,
  date,
  startTime,
  onDate,
  onTime,
}: {
  slug: string;
  timezone?: string;
  serviceId: string;
  partySize: number;
  staffId: string | null;
  date: string | null;
  startTime: string | null;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
}) {
  const t = useTranslations("public.wizard.when");
  const f = useLocaleFormat();
  const days = useMemo(() => {
    const today = dateFromISO(businessToday(timezone));
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, [timezone]);
  const availability = useAvailability({ slug, serviceId, staffId, date, partySize });

  const groups = useMemo(() => {
    const starts = [...new Set((availability.data?.slots ?? []).map((s) => s.start))].sort();
    const map = new Map<PartOfDay, string[]>();
    for (const time of starts) {
      const part = partOfDay(time);
      map.set(part, [...(map.get(part) ?? []), time]);
    }
    let offset = 0;
    return [...map.entries()].map(([label, times]) => {
      const group = { label, times, offset };
      offset += times.length;
      return group;
    });
  }, [availability.data]);

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label={t("chooseDate")}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {days.map((d) => {
          const value = format(d, "yyyy-MM-dd");
          const selected = value === date;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              aria-label={f.date(d, "EEEE d MMMM")}
              onClick={() => transition("date-pill", () => onDate(value))}
              className={cn(
                "relative isolate flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-md border py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {selected && (
                <ViewTransition name="date-pill" share="vt-pill" default="none">
                  <span aria-hidden className="absolute -inset-px -z-10 rounded-md bg-primary" />
                </ViewTransition>
              )}
              <span className={cn("text-xs font-medium", !selected && "text-muted-foreground")}>
                {f.date(d, "EEE")}
              </span>
              <span className="text-xl font-semibold leading-none">{f.date(d, "d")}</span>
              <span className={cn("text-xs", !selected && "text-muted-foreground")}>{f.date(d, "MMM")}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {!date ? null : availability.isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-md" />
            ))}
          </div>
        ) : availability.error ? (
          <ErrorState error={availability.error} onRetry={() => availability.refetch()} />
        ) : groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <CalendarDays className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">{t("noTimes")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("tryAnotherDay")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(({ label, times, offset }) => (
              <section key={label}>
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                  {t(`partOfDay.${label}`)}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {times.map((time, i) => (
                    <button
                      key={time}
                      type="button"
                      aria-pressed={time === startTime}
                      onClick={() => onTime(time)}
                      style={{ "--i": offset + i } as React.CSSProperties}
                      className={cn(
                        "slot-in h-11 rounded-md border font-mono text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        time === startTime
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
