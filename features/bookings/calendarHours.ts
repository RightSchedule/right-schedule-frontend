import { toMinutes } from "@/features/bookings/calendarGeometry";
import type { DayOfWeek, WorkingHours } from "@/types/domain";

export interface MinuteRange {
  start: number;
  end: number;
}

/** Working ranges per staff member for one weekday, in minutes. A missing key means hours are not known. */
export type StaffDayHours = Record<string, MinuteRange[]>;

const DAY_NAMES: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/** Weekday of a local-midnight Date, matching the backend's DayOfWeek names. */
export function dayOfWeekOf(date: Date): DayOfWeek {
  return DAY_NAMES[date.getDay()]!;
}

export function staffDayHours(
  hoursByStaff: Record<string, WorkingHours[] | undefined>,
  day: DayOfWeek
): StaffDayHours {
  const out: StaffDayHours = {};
  for (const [staffId, rows] of Object.entries(hoursByStaff)) {
    if (!rows) continue;
    out[staffId] = rows
      .filter((r) => r.dayOfWeek === day)
      .map((r) => ({ start: toMinutes(r.startTime), end: toMinutes(r.endTime) }))
      .sort((a, b) => a.start - b.start);
  }
  return out;
}

/** Earliest open and latest close among the given staff, or null when none of them work that day. */
export function openWindow(hours: StaffDayHours, staffIds: string[]): MinuteRange | null {
  const ranges = staffIds.flatMap((id) => hours[id] ?? []);
  if (ranges.length === 0) return null;
  return {
    start: Math.min(...ranges.map((r) => r.start)),
    end: Math.max(...ranges.map((r) => r.end)),
  };
}

const FALLBACK_FIRST_HOUR = 8;
const FALLBACK_LAST_HOUR = 19;

/**
 * Hour rows for a day grid. Follows the working window and grows to fit any booking outside it.
 * Without a window (nobody works, or hours unknown) it shows 08:00-19:00 like before.
 */
export function visibleHours(
  bookings: { startTime: string; endTime: string }[],
  window: MinuteRange | null
): { firstHour: number; lastHour: number } {
  const starts = bookings.map((b) => toMinutes(b.startTime));
  const ends = bookings.map((b) => toMinutes(b.endTime));
  if (!window) {
    return {
      firstHour: Math.min(FALLBACK_FIRST_HOUR, Math.floor(Math.min(...starts, FALLBACK_FIRST_HOUR * 60) / 60)),
      lastHour: Math.min(24, Math.max(FALLBACK_LAST_HOUR, Math.ceil(Math.max(...ends, 0) / 60))),
    };
  }
  const firstHour = Math.max(0, Math.floor(Math.min(window.start, ...starts) / 60));
  const lastHour = Math.min(24, Math.ceil(Math.max(window.end, ...ends) / 60));
  return { firstHour, lastHour: Math.max(lastHour, firstHour + 1) };
}

/** Parts of [first, last] minutes that fall outside the given working ranges. */
export function offRanges(working: MinuteRange[], first: number, last: number): MinuteRange[] {
  const out: MinuteRange[] = [];
  let cursor = first;
  for (const r of [...working].sort((a, b) => a.start - b.start)) {
    const start = Math.max(r.start, first);
    const end = Math.min(r.end, last);
    if (end <= start) continue;
    if (start > cursor) out.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < last) out.push({ start: cursor, end: last });
  return out;
}

export function minuteToTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Keyboard move of the slot cursor; null for keys that do not move it. */
export function moveSlot(
  current: number,
  key: string,
  first: number,
  last: number,
  step = 15
): number | null {
  const max = last - step;
  const clamp = (n: number) => Math.min(Math.max(n, first), max);
  switch (key) {
    case "ArrowDown":
      return clamp(current + step);
    case "ArrowUp":
      return clamp(current - step);
    case "PageDown":
      return clamp(current + 60);
    case "PageUp":
      return clamp(current - 60);
    case "Home":
      return first;
    case "End":
      return max;
    default:
      return null;
  }
}

/** Where the slot cursor starts: the next slot after now when now is on the grid, else the first row. */
export function initialSlot(nowMinute: number | null, first: number, last: number, step = 15): number {
  if (nowMinute === null || nowMinute < first || nowMinute >= last) return first;
  return Math.min(Math.floor(nowMinute / step) * step + step, last - step);
}
