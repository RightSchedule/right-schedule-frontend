import {
  format,
  parseISO,
  addMinutes,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { defaultLocale } from "@/i18n/config";
import { formatLocalized } from "@/lib/i18n/format";

export function formatDate(
  date: string | Date,
  pattern = "dd MMM yyyy",
  locale: string = defaultLocale
): string {
  return formatLocalized(date, pattern, locale);
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const base = new Date(0, 0, 0, h, m);
  const result = addMinutes(base, minutes);
  return format(result, "HH:mm");
}

export function getWeekDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  });
}

export function toStartDateTime(date: string, time: string): string {
  return `${date}T${time.slice(0, 5)}:00`;
}

/** Local-midnight Date for a yyyy-MM-dd string. */
export function dateFromISO(date: string): Date {
  return parseISO(`${date}T00:00:00`);
}

export function weekRange(cursor: Date): { from: string; to: string } {
  const days = getWeekDays(cursor);
  return {
    from: format(days[0], "yyyy-MM-dd"),
    to: format(days[days.length - 1], "yyyy-MM-dd"),
  };
}
