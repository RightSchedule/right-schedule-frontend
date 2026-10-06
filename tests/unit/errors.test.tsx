import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import errors from "@/messages/en/errors.json";
import { ApiError } from "@/lib/api/client";
import { useErrorMessage } from "@/lib/i18n/errors";

function setup() {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider locale="en" messages={{ errors }}>
      {children}
    </NextIntlClientProvider>
  );
  return renderHook(() => useErrorMessage(), { wrapper }).result.current;
}

describe("useErrorMessage", () => {
  const msg = setup();

  it("prefers a status override", () => {
    expect(msg(new ApiError(401, "x", undefined, "UNAUTHORIZED"), { overrides: { 401: "Wrong" } })).toBe(
      "Wrong"
    );
  });

  it("maps known backend codes", () => {
    expect(msg(new ApiError(403, "x", undefined, "FORBIDDEN"))).toBe(errors.codes.FORBIDDEN);
  });

  it("explains a 503 when email is disabled on the server", () => {
    expect(msg(new ApiError(503, "x", undefined, "EMAIL_DISABLED"))).toBe(errors.codes.EMAIL_DISABLED);
  });

  it("explains rate limits, with and without a wait time", () => {
    expect(msg(new ApiError(429, "x", 12))).toContain("12");
    expect(msg(new ApiError(429, "x"))).toBe(errors.tooManyAttempts);
  });

  it("explains a changed request on 422", () => {
    expect(msg(new ApiError(422, "x"))).toBe(errors.requestChanged);
  });

  it("shows backend detail for unmapped client errors", () => {
    expect(msg(new ApiError(400, "x", undefined, undefined, "Name is too long"))).toBe("Name is too long");
  });

  it("hides backend detail for server errors", () => {
    expect(msg(new ApiError(500, "x", undefined, undefined, "NullPointerException"))).toBe(errors.generic);
  });

  it("uses the fallback when given", () => {
    expect(msg(new ApiError(500, "x"), { fallback: "Custom" })).toBe("Custom");
  });

  it("treats a TypeError as a network failure", () => {
    expect(msg(new TypeError("Failed to fetch"))).toBe(errors.network);
  });

  it("passes through messages from our own code", () => {
    expect(msg(new Error("Monday: end before start"))).toBe("Monday: end before start");
  });

  it("falls back to the generic message for unknown values", () => {
    expect(msg("boom")).toBe(errors.generic);
    expect(msg(null)).toBe(errors.generic);
  });
});
