import { describe, expect, it } from "vitest";
import { pageFromParam, pageToParam } from "@/lib/hooks/useUrlParams";

describe("url page param", () => {
  it("maps 1-based URL pages to 0-based pages", () => {
    expect(pageFromParam("2")).toBe(1);
    expect(pageFromParam("10")).toBe(9);
  });

  it("falls back to the first page for missing or invalid values", () => {
    for (const raw of [null, "", "0", "1", "-3", "abc", "2.5"]) {
      expect(pageFromParam(raw)).toBe(0);
    }
  });

  it("omits the first page from the URL", () => {
    expect(pageToParam(0)).toBeNull();
    expect(pageToParam(1)).toBe("2");
  });
});
