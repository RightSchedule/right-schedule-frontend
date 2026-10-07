import { describe, expect, it } from "vitest";
import { SLUG_PATTERN, bookingPath, bookingUrl, slugify } from "@/lib/utils/booking-link";
import {
  addMinutesToTime,
  dateFromISO,
  getWeekDays,
  toStartDateTime,
  weekRange,
} from "@/lib/utils/date";
import { bookingStarted, businessMinuteOfDay, businessToday } from "@/lib/utils/clock";
import { formatPrice } from "@/lib/utils/currency";
import { isPublicPath } from "@/lib/routes";

describe("slugify", () => {
  it("lowercases, strips accents and hyphenates", () => {
    expect(slugify("Barbearia Café Português")).toBe("barbearia-cafe-portugues");
  });

  it("collapses symbols and trims hyphens", () => {
    expect(slugify("  --Hello,   World!!  ")).toBe("hello-world");
  });

  it("caps at 60 characters", () => {
    expect(slugify("a".repeat(100))).toHaveLength(60);
  });

  it("produces slugs accepted by SLUG_PATTERN", () => {
    expect(SLUG_PATTERN.test(slugify("Salão da Ana & Filhos"))).toBe(true);
  });

  it("rejects invalid slugs in SLUG_PATTERN", () => {
    for (const bad of ["Has Space", "UPPER", "-lead", "trail-", "double--dash", ""]) {
      expect(SLUG_PATTERN.test(bad)).toBe(false);
    }
  });
});

describe("booking link", () => {
  it("builds the public path", () => {
    expect(bookingPath("demo")).toBe("/b/demo");
  });

  it("falls back to a relative url without a window", () => {
    expect(bookingUrl("demo")).toMatch(/\/b\/demo$/);
  });
});

describe("isPublicPath", () => {
  it("flags public routes", () => {
    for (const p of ["/login", "/b/demo", "/privacy", "/terms", "/dpa", "/sub-processors", "/manage-booking", "/quote", "/book/demo", "/verify-email", "/reset-password", "/forgot-password", "/resend-verification", "/leave-waitlist"]) {
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it("keeps dashboard routes private", () => {
    for (const p of ["/dashboard", "/calendar", "/settings", "/", "/quotes"]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});

describe("date helpers", () => {
  it("adds minutes across midnight", () => {
    expect(addMinutesToTime("09:00", 45)).toBe("09:45");
    expect(addMinutesToTime("23:45", 30)).toBe("00:15");
  });

  it("builds the start date time without seconds drift", () => {
    expect(toStartDateTime("2026-10-05", "09:30")).toBe("2026-10-05T09:30:00");
    expect(toStartDateTime("2026-10-05", "09:30:00")).toBe("2026-10-05T09:30:00");
  });

  it("returns a Monday-to-Sunday week", () => {
    const days = getWeekDays(dateFromISO("2026-10-02"));
    expect(days).toHaveLength(7);
    expect(days[0]!.getDay()).toBe(1);
    expect(days[6]!.getDay()).toBe(0);
  });

  it("computes the week range for a mid-week date", () => {
    expect(weekRange(dateFromISO("2026-10-02"))).toEqual({ from: "2026-09-28", to: "2026-10-04" });
  });

  it("keeps a Sunday inside the week that started on Monday", () => {
    expect(weekRange(dateFromISO("2026-10-04"))).toEqual({ from: "2026-09-28", to: "2026-10-04" });
  });

  it("dateFromISO is local midnight", () => {
    const d = dateFromISO("2026-03-29");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 29, 0]);
  });
});

describe("business clock", () => {
  it("uses the business timezone for the calendar date", () => {
    const now = new Date("2026-10-02T23:30:00Z");
    expect(businessToday("UTC", now)).toBe("2026-10-02");
    expect(businessToday("Europe/Lisbon", now)).toBe("2026-10-03");
    expect(businessToday("America/New_York", now)).toBe("2026-10-02");
  });

  it("computes minute of day in the business timezone", () => {
    const now = new Date("2026-10-02T23:30:00Z");
    expect(businessMinuteOfDay("Europe/Lisbon", now)).toBe(30);
    expect(businessMinuteOfDay("UTC", now)).toBe(23 * 60 + 30);
  });

  it("detects whether a booking has started in the business timezone", () => {
    const now = new Date("2026-10-02T23:30:00Z"); // 00:30 on 10-03 in Lisbon
    expect(bookingStarted("2026-10-03", "00:30:00", "Europe/Lisbon", now)).toBe(true);
    expect(bookingStarted("2026-10-03", "00:31:00", "Europe/Lisbon", now)).toBe(false);
    expect(bookingStarted("2026-10-02", "23:00:00", "Europe/Lisbon", now)).toBe(true);
    expect(bookingStarted("2026-10-04", "00:00:00", "Europe/Lisbon", now)).toBe(false);
  });

  it("follows the DST switch", () => {
    expect(businessMinuteOfDay("Europe/Lisbon", new Date("2026-10-24T12:00:00Z"))).toBe(13 * 60);
    expect(businessMinuteOfDay("Europe/Lisbon", new Date("2026-10-26T12:00:00Z"))).toBe(12 * 60);
  });

  it("falls back to UTC for missing or invalid zones", () => {
    const now = new Date("2026-10-02T23:30:00Z");
    expect(businessToday(undefined, now)).toBe("2026-10-02");
    expect(businessToday("Mars/Phobos", now)).toBe("2026-10-02");
  });
});

describe("formatPrice", () => {
  it("formats euros per locale", () => {
    expect(formatPrice(12.5, "en")).toMatch(/€\s?12\.50/);
    expect(formatPrice(12.5, "pt")).toMatch(/12,50\s?€/);
  });

  it("falls back to the default locale", () => {
    expect(formatPrice(12.5, "fr")).toBe(formatPrice(12.5, "en"));
  });
});
