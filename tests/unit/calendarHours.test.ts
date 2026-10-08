import { describe, expect, it } from "vitest";
import {
  dayOfWeekOf,
  initialSlot,
  minuteToTime,
  moveSlot,
  offRanges,
  openWindow,
  staffDayHours,
  visibleHours,
} from "@/features/bookings/calendarHours";
import type { WorkingHours } from "@/types/domain";

const row = (staffId: string, dayOfWeek: WorkingHours["dayOfWeek"], startTime: string, endTime: string) =>
  ({ id: `${staffId}-${dayOfWeek}-${startTime}`, staffId, dayOfWeek, startTime, endTime }) as WorkingHours;

describe("dayOfWeekOf", () => {
  it("maps a local date to the backend day name", () => {
    expect(dayOfWeekOf(new Date(2026, 9, 8))).toBe("THURSDAY");
    expect(dayOfWeekOf(new Date(2026, 9, 11))).toBe("SUNDAY");
  });
});

describe("staffDayHours / openWindow", () => {
  const rows = {
    a: [row("a", "MONDAY", "09:00:00", "13:00:00"), row("a", "MONDAY", "14:00", "18:00"), row("a", "TUESDAY", "10:00", "12:00")],
    b: [row("b", "MONDAY", "08:30", "16:00")],
    c: undefined,
  };

  it("keeps only the requested weekday, sorted, in minutes", () => {
    const monday = staffDayHours(rows, "MONDAY");
    expect(monday.a).toEqual([
      { start: 540, end: 780 },
      { start: 840, end: 1080 },
    ]);
    expect(monday.b).toEqual([{ start: 510, end: 960 }]);
    expect("c" in monday).toBe(false);
  });

  it("gives an empty list for a day off, so the column reads as closed", () => {
    expect(staffDayHours(rows, "WEDNESDAY").a).toEqual([]);
  });

  it("finds the earliest open and latest close", () => {
    const monday = staffDayHours(rows, "MONDAY");
    expect(openWindow(monday, ["a", "b"])).toEqual({ start: 510, end: 1080 });
    expect(openWindow(monday, ["c"])).toBeNull();
    expect(openWindow(staffDayHours(rows, "WEDNESDAY"), ["a", "b"])).toBeNull();
  });
});

describe("visibleHours", () => {
  const booking = (startTime: string, endTime: string) => ({ startTime, endTime });

  it("follows the working window", () => {
    expect(visibleHours([], { start: 540, end: 1020 })).toEqual({ firstHour: 9, lastHour: 17 });
  });

  it("rounds a part-hour window outwards", () => {
    expect(visibleHours([], { start: 510, end: 1030 })).toEqual({ firstHour: 8, lastHour: 18 });
  });

  it("grows to fit bookings outside the window", () => {
    expect(visibleHours([booking("07:15", "08:00"), booking("18:30", "20:15")], { start: 540, end: 1020 })).toEqual({
      firstHour: 7,
      lastHour: 21,
    });
  });

  it("falls back to 08-19 without a window", () => {
    expect(visibleHours([], null)).toEqual({ firstHour: 8, lastHour: 19 });
    expect(visibleHours([booking("06:00", "07:00"), booking("19:00", "22:30")], null)).toEqual({
      firstHour: 6,
      lastHour: 23,
    });
  });

  it("never ends past midnight or collapses to zero rows", () => {
    expect(visibleHours([booking("23:00", "24:00")], { start: 1380, end: 1440 })).toEqual({ firstHour: 23, lastHour: 24 });
    expect(visibleHours([], { start: 600, end: 600 }).lastHour).toBeGreaterThan(10);
  });
});

describe("offRanges", () => {
  it("returns the gaps around and between working ranges", () => {
    expect(
      offRanges(
        [
          { start: 540, end: 780 },
          { start: 840, end: 1020 },
        ],
        480,
        1140
      )
    ).toEqual([
      { start: 480, end: 540 },
      { start: 780, end: 840 },
      { start: 1020, end: 1140 },
    ]);
  });

  it("shades the whole grid on a day off", () => {
    expect(offRanges([], 480, 1140)).toEqual([{ start: 480, end: 1140 }]);
  });

  it("shades nothing when hours cover the grid, and clips ranges outside it", () => {
    expect(offRanges([{ start: 400, end: 1200 }], 480, 1140)).toEqual([]);
    expect(offRanges([{ start: 100, end: 200 }], 480, 1140)).toEqual([{ start: 480, end: 1140 }]);
  });
});

describe("slot cursor", () => {
  it("moves by slot and hour and stays inside the grid", () => {
    expect(moveSlot(540, "ArrowDown", 480, 1140)).toBe(555);
    expect(moveSlot(540, "ArrowUp", 480, 1140)).toBe(525);
    expect(moveSlot(540, "PageDown", 480, 1140)).toBe(600);
    expect(moveSlot(500, "PageUp", 480, 1140)).toBe(480);
    expect(moveSlot(1125, "ArrowDown", 480, 1140)).toBe(1125);
    expect(moveSlot(540, "Home", 480, 1140)).toBe(480);
    expect(moveSlot(540, "End", 480, 1140)).toBe(1125);
  });

  it("ignores other keys", () => {
    expect(moveSlot(540, "a", 480, 1140)).toBeNull();
    expect(moveSlot(540, "Tab", 480, 1140)).toBeNull();
  });

  it("starts at the next slot after now when now is on the grid", () => {
    expect(initialSlot(9 * 60 + 7, 480, 1140)).toBe(9 * 60 + 15);
    expect(initialSlot(null, 480, 1140)).toBe(480);
    expect(initialSlot(7 * 60, 480, 1140)).toBe(480);
    expect(initialSlot(23 * 60, 480, 1140)).toBe(480);
    expect(initialSlot(18 * 60 + 58, 480, 1140)).toBe(1125);
  });

  it("formats minutes as HH:mm", () => {
    expect(minuteToTime(555)).toBe("09:15");
    expect(minuteToTime(0)).toBe("00:00");
  });
});
