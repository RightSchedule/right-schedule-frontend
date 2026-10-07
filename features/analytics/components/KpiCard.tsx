"use client";

import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "cn";
import { useLocaleFormat } from "@/lib/i18n/format";

function Delta({ ratio }: { ratio: number | null }) {
  const t = useTranslations("analytics.kpi");
  const f = useLocaleFormat();

  if (ratio === null) {
    return (
      <span className="text-xs font-medium text-muted-foreground" title={t("noComparison")}>
        <span aria-hidden>—</span>
        <span className="sr-only">{t("noComparison")}</span>
      </span>
    );
  }

  const Icon = ratio > 0 ? ArrowUpRight : ratio < 0 ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums",
        ratio > 0 && "text-success-foreground",
        ratio < 0 && "text-[oklch(0.45_0.2_27)]",
        ratio === 0 && "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {f.percent(ratio, { signDisplay: "exceptZero" })}
      <span className="sr-only"> {t("vsPrevious")}</span>
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  showDelta = true,
  secondary,
}: {
  label: string;
  value: string;
  /** Relative change vs the previous period; null renders a dash. */
  delta?: number | null;
  showDelta?: boolean;
  secondary?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {showDelta && <Delta ratio={delta ?? null} />}
      </div>
      {secondary && <span className="text-xs text-muted-foreground">{secondary}</span>}
    </div>
  );
}
