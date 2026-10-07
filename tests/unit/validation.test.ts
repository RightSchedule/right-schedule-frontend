import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  LIMITS,
  PHONE_PATTERN,
  hasContact,
  newPassword,
  optionalEmail,
  optionalPhone,
  requiredEmail,
  requiredName,
  requiredPhone,
} from "@/lib/validation";

const ok = (schema: z.ZodType, value: unknown) => schema.safeParse(value).success;

describe("password", () => {
  const schema = newPassword({ min: "min", max: "max" });

  it("enforces 8-72 characters", () => {
    expect(ok(schema, "a".repeat(7))).toBe(false);
    expect(ok(schema, "a".repeat(8))).toBe(true);
    expect(ok(schema, "a".repeat(72))).toBe(true);
    expect(ok(schema, "a".repeat(73))).toBe(false);
  });

  it("reports the matching message", () => {
    expect(schema.safeParse("short").error?.issues[0]?.message).toBe("min");
    expect(schema.safeParse("a".repeat(73)).error?.issues[0]?.message).toBe("max");
  });
});

describe("name", () => {
  it("trims and applies the minimum", () => {
    expect(ok(requiredName("x"), "   ")).toBe(false);
    expect(ok(requiredName("x"), " A ")).toBe(true);
    expect(ok(requiredName("x", 2), "A")).toBe(false);
    expect(ok(requiredName("x", 2), "Al")).toBe(true);
  });

  it("caps length", () => {
    expect(ok(requiredName("x"), "a".repeat(LIMITS.name))).toBe(true);
    expect(ok(requiredName("x"), "a".repeat(LIMITS.name + 1))).toBe(false);
  });
});

describe("email", () => {
  it("requires a valid address", () => {
    expect(ok(requiredEmail("x"), "a@b.pt")).toBe(true);
    expect(ok(requiredEmail("x"), "a@")).toBe(false);
    expect(ok(requiredEmail("x"), "")).toBe(false);
  });

  it("optional accepts empty string", () => {
    expect(ok(optionalEmail("x"), "")).toBe(true);
    expect(ok(optionalEmail("x"), "nope")).toBe(false);
  });
});

describe("phone", () => {
  it("matches the shared pattern", () => {
    expect(PHONE_PATTERN.test("+351 912 345 678")).toBe(true);
    expect(PHONE_PATTERN.test("912345678")).toBe(true);
    expect(PHONE_PATTERN.test("12345")).toBe(false);
    expect(PHONE_PATTERN.test("abc123456")).toBe(false);
  });

  it("required rejects empty, optional accepts it", () => {
    expect(ok(requiredPhone("x"), "")).toBe(false);
    expect(ok(optionalPhone("x"), "")).toBe(true);
    expect(ok(optionalPhone("x"), "bad")).toBe(false);
  });

  it("caps length", () => {
    expect(ok(requiredPhone("x"), "1".repeat(LIMITS.phone + 1))).toBe(false);
  });
});

describe("hasContact", () => {
  it("needs a phone or an email", () => {
    expect(hasContact({ phone: "", email: "" })).toBe(false);
    expect(hasContact({ phone: "  ", email: "" })).toBe(false);
    expect(hasContact({ phone: "912345678", email: "" })).toBe(true);
    expect(hasContact({ phone: "", email: "a@b.pt" })).toBe(true);
  });
});
