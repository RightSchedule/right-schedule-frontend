import { describe, expect, it } from "vitest";
import {
  defaultSchedule,
  emptySchedule,
  findScheduleProblem,
  scheduleFromHours,
  scheduleToEntries,
} from "@/features/staff/components/WorkingHoursEditor";
import type { WorkingHours } from "@/types/domain";

const hours = (dayOfWeek: string, startTime: string, endTime: string) =>
  ({ dayOfWeek, startTime, endTime }) as WorkingHours;

describe("findScheduleProblem", () => {
  it("accepts empty and default schedules", () => {
    expect(findScheduleProblem(emptySchedule())).toBeNull();
    expect(findScheduleProblem(defaultSchedule())).toBeNull();
  });

  it("accepts a split shift with a gap", () => {
    const s = emptySchedule();
    s.MONDAY = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "18:00" },
    ];
    expect(findScheduleProblem(s)).toBeNull();
  });

  it("accepts back-to-back ranges", () => {
    const s = emptySchedule();
    s.TUESDAY = [
      { start: "09:00", end: "12:00" },
      { start: "12:00", end: "15:00" },
    ];
    expect(findScheduleProblem(s)).toBeNull();
  });

  it("flags missing times", () => {
    const s = emptySchedule();
    s.WEDNESDAY = [{ start: "09:00", end: "" }];
    expect(findScheduleProblem(s)).toEqual({ day: "WEDNESDAY", code: "fillBoth" });
  });

  it("flags end before start and end equal to start", () => {
    const s = emptySchedule();
    s.THURSDAY = [{ start: "17:00", end: "09:00" }];
    expect(findScheduleProblem(s)).toEqual({ day: "THURSDAY", code: "endBeforeStart" });
    s.THURSDAY = [{ start: "09:00", end: "09:00" }];
    expect(findScheduleProblem(s)).toEqual({ day: "THURSDAY", code: "endBeforeStart" });
  });

  it("flags overlaps regardless of input order", () => {
    const s = emptySchedule();
    s.FRIDAY = [
      { start: "13:00", end: "18:00" },
      { start: "09:00", end: "14:00" },
    ];
    expect(findScheduleProblem(s)).toEqual({ day: "FRIDAY", code: "overlap" });
  });

  it("reports the first problem in week order", () => {
    const s = emptySchedule();
    s.SUNDAY = [{ start: "10:00", end: "09:00" }];
    s.MONDAY = [{ start: "10:00", end: "" }];
    expect(findScheduleProblem(s)?.day).toBe("MONDAY");
  });
});

describe("schedule conversion", () => {
  it("builds a sorted schedule and trims seconds", () => {
    const s = scheduleFromHours([
      hours("MONDAY", "14:00:00", "18:00:00"),
      hours("MONDAY", "09:00:00", "12:00:00"),
      hours("SATURDAY", "10:00", "14:00"),
    ]);
    expect(s.MONDAY).toEqual([
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "18:00" },
    ]);
    expect(s.SATURDAY).toEqual([{ start: "10:00", end: "14:00" }]);
    expect(s.TUESDAY).toEqual([]);
  });

  it("flattens to entries in week order", () => {
    const s = emptySchedule();
    s.SUNDAY = [{ start: "10:00", end: "12:00" }];
    s.MONDAY = [{ start: "09:00", end: "17:00" }];
    expect(scheduleToEntries(s)).toEqual([
      { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: "SUNDAY", startTime: "10:00", endTime: "12:00" },
    ]);
  });

  it("round-trips through the API shape", () => {
    const s = defaultSchedule();
    const back = scheduleFromHours(
      scheduleToEntries(s).map((e) => hours(e.dayOfWeek, e.startTime, e.endTime))
    );
    expect(back).toEqual(s);
  });
});
