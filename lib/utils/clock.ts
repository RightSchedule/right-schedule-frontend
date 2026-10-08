import { useSyncExternalStore } from "react";

const DEFAULT_TZ = "UTC";

function parts(tz: string, now: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(now)) p[part.type] = part.value;
  return p;
}

function safeParts(tz: string | undefined, now: Date) {
  try {
    return parts(tz || DEFAULT_TZ, now);
  } catch {
    return parts(DEFAULT_TZ, now);
  }
}

/** Current calendar date (yyyy-MM-dd) in the business timezone. */
export function businessToday(tz?: string, now = new Date()): string {
  const p = safeParts(tz, now);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Minutes since midnight in the business timezone. */
export function businessMinuteOfDay(tz?: string, now = new Date()): number {
  const p = safeParts(tz, now);
  return Number(p.hour) * 60 + Number(p.minute);
}

function formatMinute(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** First slot boundary strictly after `minuteOfDay` as HH:mm, capped so it still starts on the same day. */
export function nextSlotTime(minuteOfDay: number, step = 15): string {
  const size = Math.max(5, step);
  return formatMinute(Math.min(Math.floor(minuteOfDay / size) * size + size, 24 * 60 - size));
}

/** Time a new booking dialog should open with: the next free-looking slot today, 09:00 on other days. */
export function defaultBookingTime(date: string, tz?: string, step = 15, now = new Date()): string {
  return date === businessToday(tz, now) ? nextSlotTime(businessMinuteOfDay(tz, now), step) : "09:00";
}

/** True once a booking's start (yyyy-MM-dd + HH:mm[:ss]) has passed in the business timezone. */
export function bookingStarted(date: string, startTime: string, tz?: string, now = new Date()): boolean {
  const today = businessToday(tz, now);
  if (date !== today) return date < today;
  const [h, m] = startTime.split(":").map(Number);
  return businessMinuteOfDay(tz, now) >= h * 60 + m;
}

function subscribe(cb: () => void) {
  const id = setInterval(cb, 20_000);
  return () => clearInterval(id);
}

/** Ticking minute-of-day in the business timezone; null when disabled. */
export function useBusinessMinute(tz: string | undefined, enabled: boolean): number | null {
  const minute = useSyncExternalStore(
    subscribe,
    () => (enabled ? businessMinuteOfDay(tz) : -1),
    () => -1
  );
  return minute < 0 ? null : minute;
}
