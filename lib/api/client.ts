const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
}

const PUBLIC_PREFIXES = ["/login", "/b/", "/privacy", "/terms", "/dpa", "/sub-processors"];

function onPublicPage(): boolean {
  return PUBLIC_PREFIXES.some((p) => window.location.pathname.startsWith(p));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  if (res.status === 401 && typeof window !== "undefined" && !onPublicPage()) {
    // Session cookie is HttpOnly: only the backend can clear it.
    await fetch(`${BASE_URL}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(
      () => undefined
    );
    window.location.assign("/login");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const retryAfter = Number(res.headers.get("Retry-After"));
    throw new ApiError(
      res.status,
      body.detail ?? body.message ?? "Request failed",
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      typeof body.code === "string" ? body.code : undefined
    );
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), headers: opts?.headers }),
  put: <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body), headers: opts?.headers }),
  patch: <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body), headers: opts?.headers }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};

export function isUnavailable(error: unknown): boolean {
  if (error instanceof ApiError) return [404, 405, 501].includes(error.status);
  return error instanceof TypeError;
}

export function isStatus(error: unknown, ...codes: number[]): boolean {
  return error instanceof ApiError && codes.includes(error.status);
}

export { ApiError };
