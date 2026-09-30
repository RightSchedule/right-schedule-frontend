import { apiClient } from "./client";
import type { DashboardResponse, Granularity } from "@/types/api";

// Backend serializes the Java enum as DAY/WEEK/MONTH.
function normalizeGranularity(value: string): Granularity {
  const v = value.toLowerCase();
  return v === "week" || v === "month" ? v : "day";
}

export const analyticsApi = {
  dashboard: async (from: string, to: string): Promise<DashboardResponse> => {
    const data = await apiClient.get<DashboardResponse>(
      `/api/v1/analytics/dashboard?${new URLSearchParams({ from, to }).toString()}`
    );
    return { ...data, granularity: normalizeGranularity(String(data.granularity)) };
  },
};
