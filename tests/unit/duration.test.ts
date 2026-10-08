import { describe, expect, it } from "vitest";
import { amountToMinutes, bestUnit, describeDuration, minutesToAmount } from "@/lib/utils/duration";

describe("bestUnit", () => {
  it("picks the largest unit that divides evenly", () => {
    expect(bestUnit(1440)).toBe("days");
    expect(bestUnit(2880)).toBe("days");
    expect(bestUnit(120)).toBe("hours");
    expect(bestUnit(90)).toBe("minutes");
    expect(bestUnit(45)).toBe("minutes");
  });

  it("defaults to hours for empty or zero", () => {
    expect(bestUnit(0)).toBe("hours");
    expect(bestUnit(null)).toBe("hours");
    expect(bestUnit(undefined)).toBe("hours");
    expect(bestUnit(Number.NaN)).toBe("hours");
  });
});

describe("conversions", () => {
  it("converts minutes to the unit amount", () => {
    expect(minutesToAmount(120, "hours")).toBe(2);
    expect(minutesToAmount(2880, "days")).toBe(2);
    expect(minutesToAmount(30, "minutes")).toBe(30);
  });

  it("converts an amount to whole minutes without float noise", () => {
    expect(amountToMinutes(2, "hours")).toBe(120);
    expect(amountToMinutes(1.5, "hours")).toBe(90);
    expect(amountToMinutes(1.1, "hours")).toBe(66);
    expect(amountToMinutes(30, "days")).toBe(43200);
  });

  it("describes a duration with a whole count", () => {
    expect(describeDuration(1440)).toEqual({ unit: "days", count: 1 });
    expect(describeDuration(180)).toEqual({ unit: "hours", count: 3 });
    expect(describeDuration(45)).toEqual({ unit: "minutes", count: 45 });
  });
});
