import { apiClient } from "./client";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const MAX_PAGE_SIZE = 200;

type Params = Record<string, string | number | boolean | undefined | null>;

function toQuery(params: Params): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  return query.toString();
}

export function fetchPage<T>(path: string, params: Params = {}): Promise<PageResponse<T>> {
  return apiClient.get<PageResponse<T>>(`${path}?${toQuery(params)}`);
}

/** Fetches every page of a paginated endpoint and returns the flattened items. */
export async function listAll<T>(path: string, params: Params = {}): Promise<T[]> {
  const fetchAt = (page: number) => fetchPage<T>(path, { ...params, size: MAX_PAGE_SIZE, page });
  const first = await fetchAt(0);
  if (first.totalPages <= 1) return first.content;
  const rest = await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, i) => fetchAt(i + 1)));
  return [first, ...rest].flatMap((res) => res.content);
}
