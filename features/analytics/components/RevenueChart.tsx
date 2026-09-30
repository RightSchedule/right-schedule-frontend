"use client";

import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { DashboardResponse, Granularity } from "@/types/api";

type Point = DashboardResponse["revenueSeries"][number];

const MIN_BAR_SLOT_PX = 28;

function useBucketLabel() {
  const t = useTranslations("analytics.chart");
  const f = useLocaleFormat();
  return (bucket: string, granularity: Granularity) => {
    switch (granularity) {
      case "week":
        return t("weekOf", { date: f.date(bucket, "d MMM") });
      case "month":
        return f.date(bucket, "MMM yyyy");
      default:
        return f.date(bucket, "d MMM");
    }
  };
}

export function RevenueChart({
  series,
  granularity,
}: {
  series: Point[];
  granularity: Granularity;
}) {
  const t = useTranslations("analytics.chart");
  const f = useLocaleFormat();
  const label = useBucketLabel();

  return (
    <div className="overflow-x-auto">
      <div
        role="img"
        aria-label={t("aria")}
        className="h-64 w-full"
        style={{ minWidth: Math.min(series.length * MIN_BAR_SLOT_PX, 900) }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="bucket"
              tickFormatter={(v: string) => label(v, granularity)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={granularity === "week" ? 24 : 16}
              interval="equidistantPreserveStart"
            />
            <YAxis
              tickFormatter={(v: number) => f.price(v)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={72}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
                if (!point) return null;
                return (
                  <div className="rounded-2xl border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-card">
                    <div className="font-semibold">{label(point.bucket, granularity)}</div>
                    <div>{t("tooltipRevenue", { amount: f.price(point.revenue) })}</div>
                    <div className="text-muted-foreground">
                      {t("tooltipBookings", { count: point.completedBookings })}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
