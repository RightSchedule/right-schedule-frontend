// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Client = typeof import("@/lib/api/client");

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

let fetchMock: ReturnType<typeof vi.fn>;
let assign: ReturnType<typeof vi.fn>;

async function load(pathname = "/dashboard"): Promise<Client> {
  vi.resetModules();
  assign = vi.fn();
  vi.stubGlobal("window", { location: { pathname, assign } });
  return import("@/lib/api/client");
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("error helpers", () => {
  it("isUnavailable covers code-less 404, 405 and 501 only", async () => {
    const { ApiError, isUnavailable } = await load();
    for (const s of [404, 405, 501]) expect(isUnavailable(new ApiError(s, "x"))).toBe(true);
    expect(isUnavailable(new ApiError(404, "x", undefined, "STAFF_NOT_FOUND"))).toBe(false);
    for (const s of [400, 401, 500, 503]) expect(isUnavailable(new ApiError(s, "x"))).toBe(false);
    expect(isUnavailable(new TypeError("Failed to fetch"))).toBe(false);
  });

  it("isStatus matches listed codes", async () => {
    const { ApiError, isStatus } = await load();
    expect(isStatus(new ApiError(409, "x"), 409, 422)).toBe(true);
    expect(isStatus(new ApiError(500, "x"), 409, 422)).toBe(false);
    expect(isStatus(new Error("x"), 500)).toBe(false);
  });
});

describe("request", () => {
  it("returns parsed JSON and sends credentials", async () => {
    const { apiClient } = await load();
    fetchMock.mockResolvedValueOnce(json({ ok: true }));
    await expect(apiClient.get("/api/v1/services")).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ credentials: "include" });
  });

  it("returns undefined on 204", async () => {
    const { apiClient } = await load();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(apiClient.delete("/api/v1/services/1")).resolves.toBeUndefined();
  });

  it("maps error bodies to ApiError with code and detail", async () => {
    const { apiClient, ApiError } = await load();
    fetchMock.mockResolvedValueOnce(json({ detail: "Slot taken", code: "BOOKING_CONFLICT" }, 409));
    const err = await apiClient.post("/api/v1/bookings", {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: "BOOKING_CONFLICT", detail: "Slot taken" });
  });

  it("survives non-JSON error bodies", async () => {
    const { apiClient } = await load();
    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 502, statusText: "Bad Gateway" }));
    const err = await apiClient.get("/api/v1/x").catch((e) => e);
    expect(err).toMatchObject({ status: 502 });
  });

  it("reads Retry-After on 429 and falls back to 30s", async () => {
    const { apiClient } = await load();
    fetchMock.mockResolvedValueOnce(json({}, 429, { "Retry-After": "12" }));
    expect(await apiClient.get("/api/v1/x").catch((e) => e)).toMatchObject({ retryAfter: 12 });
    fetchMock.mockResolvedValueOnce(json({}, 429));
    expect(await apiClient.get("/api/v1/x").catch((e) => e)).toMatchObject({ retryAfter: 30 });
  });
});

describe("401 handling", () => {
  it("refreshes once and retries the original request", async () => {
    const { apiClient } = await load();
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({}, 200))
      .mockResolvedValueOnce(json({ data: 1 }));
    await expect(apiClient.get("/api/v1/bookings")).resolves.toEqual({ data: 1 });
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([
      expect.stringContaining("/api/v1/bookings"),
      expect.stringContaining("/api/v1/auth/refresh"),
      expect.stringContaining("/api/v1/bookings"),
    ]);
    expect(assign).not.toHaveBeenCalled();
  });

  it("shares a single refresh between parallel 401s", async () => {
    const { apiClient } = await load();
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("/auth/refresh")) {
        refreshCalls++;
        return json({}, 200);
      }
      return refreshCalls === 0 ? json({}, 401) : json({ ok: 1 });
    });
    const results = await Promise.all([
      apiClient.get("/api/v1/a"),
      apiClient.get("/api/v1/b"),
      apiClient.get("/api/v1/c"),
    ]);
    expect(results).toEqual([{ ok: 1 }, { ok: 1 }, { ok: 1 }]);
    expect(refreshCalls).toBe(1);
  });

  it("logs out and redirects when refresh fails", async () => {
    const { apiClient } = await load();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes("/auth/refresh")) return json({}, 401);
      if (u.includes("/auth/logout")) return new Response(null, { status: 204 });
      return json({}, 401);
    });
    await apiClient.get("/api/v1/bookings").catch(() => undefined);
    expect(assign).toHaveBeenCalledWith("/login?signedout=1");
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/auth/logout"))).toBe(true);
  });

  it("redirects only once for concurrent failures", async () => {
    const { apiClient } = await load();
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("/auth/logout") ? new Response(null, { status: 204 }) : json({}, 401)
    );
    await Promise.all([
      apiClient.get("/api/v1/a").catch(() => undefined),
      apiClient.get("/api/v1/b").catch(() => undefined),
    ]);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it("does not refresh for auth endpoints", async () => {
    const { apiClient } = await load();
    fetchMock.mockResolvedValueOnce(json({ detail: "bad", code: "INVALID_CREDENTIALS" }, 401));
    const err = await apiClient.post("/api/v1/auth/login", {}).catch((e) => e);
    expect(err).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not refresh or redirect on public pages", async () => {
    const { apiClient } = await load("/b/demo");
    fetchMock.mockResolvedValueOnce(json({}, 401));
    await apiClient.get("/api/v1/public/x").catch(() => undefined);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });
});
