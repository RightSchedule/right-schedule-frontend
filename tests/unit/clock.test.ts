import { describe, expect, it } from "vitest";
import { defaultBookingTime, nextSlotTime } from "@/lib/utils/clock";

describe("nextSlotTime", () => {
  it("rounds up to the next slot boundary", () => {
    expect(nextSlotTime(9 * 60 + 1)).toBe("09:15");
    expect(nextSlotTime(9 * 60 + 14)).toBe("09:15");
  });

  it("moves past a boundary that is exactly now", () => {
    expect(nextSlotTime(9 * 60)).toBe("09:15");
    expect(nextSlotTime(9 * 60, 30)).toBe("09:30");
  });

  it("caps at the last slot of the day", () => {
    expect(nextSlotTime(23 * 60 + 50)).toBe("23:45");
  });

  it("ignores absurdly small steps", () => {
    expect(nextSlotTime(10 * 60, 1)).toBe("10:05");
  });
});

describe("defaultBookingTime", () => {
  const now = new Date("2026-10-08T13:07:00Z");

  it("uses the next slot on the business's today", () => {
    expect(defaultBookingTime("2026-10-08", "UTC", 15, now)).toBe("13:15");
  });

  it("uses the business timezone to decide today", () => {
    expect(defaultBookingTime("2026-10-08", "Asia/Tokyo", 30, now)).toBe("22:30");
  });

  it("falls back to 09:00 for other days", () => {
    expect(defaultBookingTime("2026-10-09", "UTC", 15, now)).toBe("09:00");
    expect(defaultBookingTime("2026-10-07", "UTC", 15, now)).toBe("09:00");
  });
});
