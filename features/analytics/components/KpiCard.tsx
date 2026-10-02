"use client";

import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
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
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        ratio > 0 && "bg-success-muted text-success-foreground",
        ratio < 0 && "bg-destructive/10 text-[oklch(0.45_0.2_27)]",
        ratio === 0 && "bg-muted text-muted-foreground"
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
    <Card className="flex flex-col gap-2 p-5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {showDelta && <Delta ratio={delta ?? null} />}
      </div>
      {secondary && <span className="text-xs text-muted-foreground">{secondary}</span>}
    </Card>
  );
}
