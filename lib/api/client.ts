import { isPublicPath } from "@/lib/routes";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
    public code?: string,
    public detail?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
}

const AUTH_PATH = "/api/v1/auth/";
const LOGOUT_TIMEOUT_MS = 3000;
const DEFAULT_RETRY_AFTER_SECONDS = 30;

let signingOut = false;
let refreshing: Promise<boolean> | null = null;

/** Session cookies are HttpOnly: only the backend can clear them. Never rejects. */
export async function requestLogout() {
  await fetch(`${BASE_URL}${AUTH_PATH}logout`, {
    method: "POST",
    credentials: "include",
    signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS),
  }).catch(() => undefined);
}

/** Concurrent 401s share one logout + redirect. */
async function signOut() {
  if (signingOut) return;
  signingOut = true;
  await requestLogout();
  // Hard navigation on purpose: drops every in-memory cache and query state of the expired session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login?signedout=1");
}

/** One shared refresh for all parallel 401s; the backend rotates the HttpOnly cookies. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE_URL}${AUTH_PATH}refresh`, { method: "POST", credentials: "include" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  if (
    res.status === 401 &&
    !path.startsWith(AUTH_PATH) &&
    typeof window !== "undefined" &&
    !isPublicPath(window.location.pathname)
  ) {
    if (!retried && (await refreshSession())) return request<T>(path, init, true);
    await signOut();
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    throw new ApiError(
      429,
      "Too many requests",
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : DEFAULT_RETRY_AFTER_SECONDS
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = body.detail ?? body.message;
    throw new ApiError(
      res.status,
      detail ?? "Request failed",
      undefined,
      typeof body.code === "string" ? body.code : undefined,
      typeof detail === "string" && detail !== "" ? detail : undefined
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

/** A missing route. A 404 carrying an error `code` is a real "entity not found", not an unbuilt endpoint. */
export function isUnavailable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 404) return !error.code;
  return [405, 501].includes(error.status);
}

export function isStatus(error: unknown, ...codes: number[]): boolean {
  return error instanceof ApiError && codes.includes(error.status);
}

export { ApiError };
