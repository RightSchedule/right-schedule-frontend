"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { WorkingHoursEntry } from "@/lib/api/staff";
import type { DayOfWeek, WorkingHours } from "@/types/domain";

export const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export interface TimeRange {
  start: string;
  end: string;
}

export type WeekSchedule = Record<DayOfWeek, TimeRange[]>;

export function emptySchedule(): WeekSchedule {
  return {
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: [],
    SUNDAY: [],
  };
}

export function defaultSchedule(): WeekSchedule {
  const s = emptySchedule();
  for (const d of ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const) {
    s[d] = [{ start: "09:00", end: "17:00" }];
  }
  return s;
}

export function scheduleFromHours(hours: WorkingHours[]): WeekSchedule {
  const s = emptySchedule();
  for (const h of hours) {
    s[h.dayOfWeek].push({ start: h.startTime.slice(0, 5), end: h.endTime.slice(0, 5) });
  }
  for (const d of DAYS) s[d].sort((a, b) => a.start.localeCompare(b.start));
  return s;
}

export function scheduleToEntries(s: WeekSchedule): WorkingHoursEntry[] {
  return DAYS.flatMap((day) =>
    s[day].map((r) => ({ dayOfWeek: day, startTime: r.start, endTime: r.end }))
  );
}

export type ScheduleProblemCode = "fillBoth" | "endBeforeStart" | "overlap";

export interface ScheduleProblem {
  day: DayOfWeek;
  code: ScheduleProblemCode;
}

/** Returns the first problem found (language-neutral), or null when the schedule is valid. */
export function findScheduleProblem(s: WeekSchedule): ScheduleProblem | null {
  for (const day of DAYS) {
    const ranges = [...s[day]].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i]!;
      if (!r.start || !r.end) return { day, code: "fillBoth" };
      if (r.end <= r.start) return { day, code: "endBeforeStart" };
      const next = ranges[i + 1];
      if (next && next.start < r.end) return { day, code: "overlap" };
    }
  }
  return null;
}

/**
 * Hook returning a validator: translated error message for the first schedule problem,
 * or null when the schedule is valid.
 */
export function useValidateSchedule() {
  const t = useTranslations("staff.hoursEditor.errors");
  const tDays = useTranslations("common.weekdays");
  return (s: WeekSchedule): string | null => {
    const problem = findScheduleProblem(s);
    if (!problem) return null;
    return t(problem.code, { day: tDays(problem.day) });
  };
}

export function WorkingHoursEditor({
  value,
  onChange,
}: {
  value: WeekSchedule;
  onChange: (next: WeekSchedule) => void;
}) {
  const t = useTranslations("staff.hoursEditor");
  const tDays = useTranslations("common.weekdays");

  function setDay(day: DayOfWeek, ranges: TimeRange[]) {
    onChange({ ...value, [day]: ranges });
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {DAYS.map((day) => {
        const label = tDays(day);
        const ranges = value[day];
        const open = ranges.length > 0;
        return (
          <li key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex w-full items-center justify-between gap-3 sm:w-44 sm:pt-1.5">
              <label className="flex items-center gap-3 text-base font-medium">
                <Switch
                  checked={open}
                  onCheckedChange={(checked) =>
                    setDay(day, checked ? [{ start: "09:00", end: "17:00" }] : [])
                  }
                  aria-label={t("openAria", { day: label })}
                />
                {label}
              </label>
              {!open && (
                <span className="text-xs text-muted-foreground sm:hidden">{t("closed")}</span>
              )}
            </div>

            <div className="flex-1">
              {!open ? (
                <p className="hidden pt-1.5 text-sm text-muted-foreground sm:block">{t("closed")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ranges.map((range, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="time"
                        step={900}
                        value={range.start}
                        aria-label={t("startAria", { day: label, n: i + 1 })}
                        className="w-28 font-mono"
                        onChange={(e) =>
                          setDay(
                            day,
                            ranges.map((r, j) => (j === i ? { ...r, start: e.target.value } : r))
                          )
                        }
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        step={900}
                        value={range.end}
                        aria-label={t("endAria", { day: label, n: i + 1 })}
                        className="w-28 font-mono"
                        onChange={(e) =>
                          setDay(
                            day,
                            ranges.map((r, j) => (j === i ? { ...r, end: e.target.value } : r))
                          )
                        }
                      />
                      {ranges.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("removeAria", { day: label, n: i + 1 })}
                          onClick={() => setDay(day, ranges.filter((_, j) => j !== i))}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-fit text-muted-foreground"
                    onClick={() => setDay(day, [...ranges, { start: "14:00", end: "18:00" }])}
                  >
                    <Plus /> {t("addRange")}
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
