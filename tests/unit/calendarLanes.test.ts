import { describe, expect, it } from "vitest";
import { laneStyle, layoutLanes } from "@/features/bookings/calendarLanes";

const b = (id: string, start: string, end: string) => {
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  return { id, start: m(start), end: m(end) };
};

describe("layoutLanes", () => {
  it("gives a lone booking the full width", () => {
    const out = layoutLanes([b("a", "09:00", "10:00")]);
    expect(out.get("a")).toEqual({ lane: 0, lanes: 1 });
  });

  it("treats back-to-back bookings as separate", () => {
    const out = layoutLanes([b("a", "09:00", "10:00"), b("b", "10:00", "11:00")]);
    expect(out.get("a")).toEqual({ lane: 0, lanes: 1 });
    expect(out.get("b")).toEqual({ lane: 0, lanes: 1 });
  });

  it("puts overlapping bookings side by side", () => {
    const out = layoutLanes([b("a", "09:00", "10:00"), b("b", "09:30", "10:30")]);
    expect(out.get("a")).toEqual({ lane: 0, lanes: 2 });
    expect(out.get("b")).toEqual({ lane: 1, lanes: 2 });
  });

  it("reuses a lane once it is free and sizes the cluster by its widest point", () => {
    const out = layoutLanes([
      b("a", "09:00", "11:00"),
      b("b", "09:30", "10:00"),
      b("c", "10:00", "10:30"),
      b("d", "10:15", "10:45"),
    ]);
    expect(out.get("a")).toEqual({ lane: 0, lanes: 3 });
    expect(out.get("b")).toEqual({ lane: 1, lanes: 3 });
    expect(out.get("c")).toEqual({ lane: 1, lanes: 3 });
    expect(out.get("d")).toEqual({ lane: 2, lanes: 3 });
  });

  it("keeps separate clusters independent", () => {
    const out = layoutLanes([
      b("a", "09:00", "10:00"),
      b("b", "09:15", "09:45"),
      b("c", "13:00", "14:00"),
    ]);
    expect(out.get("a")?.lanes).toBe(2);
    expect(out.get("c")).toEqual({ lane: 0, lanes: 1 });
  });

  it("counts a short booking at its drawn height", () => {
    const tight = [b("a", "09:00", "09:20"), b("b", "09:20", "09:40")];
    expect(layoutLanes(tight).get("b")?.lanes).toBe(1);
    expect(layoutLanes(tight, 45).get("a")).toEqual({ lane: 0, lanes: 2 });
    expect(layoutLanes(tight, 45).get("b")).toEqual({ lane: 1, lanes: 2 });
  });

  it("is stable for identical start times", () => {
    const out = layoutLanes([b("short", "09:00", "09:30"), b("long", "09:00", "10:30")]);
    expect(out.get("long")?.lane).toBe(0);
    expect(out.get("short")?.lane).toBe(1);
  });
});

describe("maxLanes", () => {
  it("stacks the overflow on the last lane instead of making slivers", () => {
    const pile = ["a", "b", "c", "d", "e"].map((id) => b(id, "09:00", "10:00"));
    const out = layoutLanes(pile, 0, 3);
    expect([...out.values()].every((p) => p.lanes === 3)).toBe(true);
    expect(out.get("a")?.lane).toBe(0);
    expect(out.get("c")?.lane).toBe(2);
    expect(out.get("d")?.lane).toBe(2);
    expect(out.get("e")?.lane).toBe(2);
  });

  it("does not change a cluster that fits", () => {
    const out = layoutLanes([b("a", "09:00", "10:00"), b("b", "09:30", "10:30")], 0, 3);
    expect(out.get("b")).toEqual({ lane: 1, lanes: 2 });
  });
});

describe("laneStyle", () => {
  it("keeps the old inset when alone", () => {
    expect(laneStyle(undefined)).toEqual({ left: "4px", width: "calc(100% - 8px)" });
    expect(laneStyle({ lane: 0, lanes: 1 })).toEqual({ left: "4px", width: "calc(100% - 8px)" });
  });

  it("splits width equally across lanes", () => {
    expect(laneStyle({ lane: 1, lanes: 2 })).toEqual({ left: "calc(50% + 2px)", width: "calc(50% - 4px)" });
  });
});
