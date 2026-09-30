import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfMonth } from "date-fns";

export const MAX_RANGE_DAYS = 366;

export interface DateRange {
  from: string;
  to: string;
}

export type RangeProblem = "incomplete" | "reversed" | "tooLong";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export function rangeProblem(from: string | null | undefined, to: string | null | undefined): RangeProblem | null {
  if (!isRealDate(from) || !isRealDate(to)) return "incomplete";
  const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
  if (days < 1) return "reversed";
  if (days > MAX_RANGE_DAYS) return "tooLong";
  return null;
}

function shift(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

export type PresetId = "7d" | "30d" | "90d" | "month";

export const PRESET_IDS: PresetId[] = ["7d", "30d", "90d", "month"];

export function presetRange(id: PresetId, today: string): DateRange {
  switch (id) {
    case "7d":
      return { from: shift(today, -6), to: today };
    case "30d":
      return { from: shift(today, -29), to: today };
    case "90d":
      return { from: shift(today, -89), to: today };
    case "month":
      return { from: format(startOfMonth(parseISO(today)), "yyyy-MM-dd"), to: today };
  }
}

export function matchingPreset(range: DateRange, today: string): PresetId | null {
  return PRESET_IDS.find((id) => {
    const p = presetRange(id, today);
    return p.from === range.from && p.to === range.to;
  }) ?? null;
}

/** Relative change vs the previous period, or null when there is nothing to compare against. */
export function deltaRatio(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / previous;
}
