import { apiClient } from "./client";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const MAX_PAGE_SIZE = 200;

type Params = Record<string, string | number | undefined | null>;

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
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const res = await fetchPage<T>(path, { ...params, size: MAX_PAGE_SIZE, page });
    items.push(...res.content);
    if (page + 1 >= res.totalPages) return items;
  }
}
