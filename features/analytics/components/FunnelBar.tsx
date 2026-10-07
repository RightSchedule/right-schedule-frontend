"use client";

import { useTranslations } from "next-intl";
import { cn } from "cn";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { DashboardResponse } from "@/types/api";

const SEGMENTS = [
  { key: "completed", color: "bg-success" },
  { key: "confirmed", color: "bg-info" },
  { key: "cancelled", color: "bg-destructive" },
  { key: "noShow", color: "bg-warning" },
] as const;

export function FunnelBar({
  funnel,
  total,
}: {
  funnel: DashboardResponse["funnel"];
  total: number;
}) {
  const t = useTranslations("analytics.funnel");
  const f = useLocaleFormat();
  const share = (count: number) => (total > 0 ? count / total : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 w-full overflow-hidden rounded-sm bg-muted" aria-hidden>
        {SEGMENTS.map(({ key, color }) => (
          <div
            key={key}
            className={cn("h-full", color)}
            style={{ width: `${share(funnel[key]) * 100}%` }}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SEGMENTS.map(({ key, color }) => (
          <li key={key} className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn("size-2.5 rounded-full", color)} aria-hidden />
              {t(key)}
            </span>
            <span className="text-xl font-semibold">{funnel[key]}</span>
            <span className="text-xs text-muted-foreground">{f.percent(share(funnel[key]))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
