import { afterEach, describe, expect, it, vi } from "vitest";
import { homeForRole } from "@/features/auth/hooks/useAccount";
import { reasonError } from "@/features/admin/components/ReasonDialog";
import { adminApi } from "@/lib/api/admin";
import { isPublicPath } from "@/lib/routes";

describe("homeForRole", () => {
  it("sends platform admins to the back office", () => {
    expect(homeForRole("PLATFORM_ADMIN")).toBe("/admin");
  });

  it("sends owners, staff and unknown roles to the business app", () => {
    expect(homeForRole("BUSINESS_OWNER")).toBe("/dashboard");
    expect(homeForRole("STAFF")).toBe("/dashboard");
    expect(homeForRole(undefined)).toBe("/dashboard");
  });
});

describe("reasonError", () => {
  it("requires at least 3 characters after trimming", () => {
    expect(reasonError("  ab  ")).toBe("tooShort");
    expect(reasonError("abc")).toBeNull();
  });

  it("caps at 500 characters", () => {
    expect(reasonError("a".repeat(500))).toBeNull();
    expect(reasonError("a".repeat(501))).toBe("tooLong");
  });
});

describe("admin routes", () => {
  it("are never public", () => {
    expect(isPublicPath("/admin")).toBe(false);
    expect(isPublicPath("/admin/businesses/123")).toBe(false);
  });
});

describe("adminApi", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch() {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("omits empty filters from the business list query", async () => {
    const fetchMock = stubFetch();

    await adminApi.businesses({ search: "", status: null, page: 2 });

    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain("/api/v1/admin/businesses?");
    expect(url).toContain("page=2");
    expect(url).toContain("size=25");
    expect(url).not.toContain("search=");
    expect(url).not.toContain("status=");
  });

  it("filters the list by approval status", async () => {
    const fetchMock = stubFetch();

    await adminApi.businesses({ status: "PENDING_APPROVAL" });

    expect(String(fetchMock.mock.calls[0]![0])).toContain("status=PENDING_APPROVAL");
  });

  it("approves without a body and rejects with a reason", async () => {
    const fetchMock = stubFetch();

    await adminApi.approveBusiness("b1");
    await adminApi.rejectBusiness("b1", "Spam");

    const [approveUrl, approveInit] = fetchMock.mock.calls[0]!;
    expect(String(approveUrl)).toContain("/api/v1/admin/businesses/b1/approve");
    expect(approveInit.body).toBeUndefined();
    const [rejectUrl, rejectInit] = fetchMock.mock.calls[1]!;
    expect(String(rejectUrl)).toContain("/api/v1/admin/businesses/b1/reject");
    expect(JSON.parse(rejectInit.body)).toEqual({ reason: "Spam" });
  });

  it("posts the trimmed reason when suspending", async () => {
    const fetchMock = stubFetch();

    await adminApi.suspendBusiness("b1", "Chargebacks");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/api/v1/admin/businesses/b1/suspend");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ reason: "Chargebacks" });
  });
});
