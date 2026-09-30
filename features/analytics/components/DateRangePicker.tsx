"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAX_RANGE_DAYS,
  PRESET_IDS,
  matchingPreset,
  presetRange,
  rangeProblem,
  type DateRange,
} from "../range";

function CustomRange({
  initial,
  onApply,
}: {
  initial: DateRange;
  onApply: (range: DateRange) => void;
}) {
  const t = useTranslations("analytics.range");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [attempted, setAttempted] = useState(false);
  const problem = rangeProblem(from, to);

  function apply() {
    setAttempted(true);
    if (!problem) onApply({ from, to });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {t("from")}
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-invalid={attempted && problem !== null}
            className="w-40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {t("to")}
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={attempted && problem !== null}
            className="w-40"
          />
        </label>
        <Button onClick={apply}>{t("apply")}</Button>
      </div>
      {attempted && problem && (
        <p role="alert" className="text-sm text-destructive">
          {t(`problem.${problem}`, { days: MAX_RANGE_DAYS })}
        </p>
      )}
    </div>
  );
}

export function DateRangePicker({
  range,
  today,
  onChange,
}: {
  range: DateRange;
  today: string;
  onChange: (range: DateRange) => void;
}) {
  const t = useTranslations("analytics.range");
  const active = matchingPreset(range, today);
  const [customOpen, setCustomOpen] = useState(active === null);
  const showCustom = customOpen || active === null;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={t("label")} className="flex flex-wrap gap-2">
        {PRESET_IDS.map((id) => (
          <Button
            key={id}
            size="sm"
            variant={active === id ? "default" : "outline"}
            aria-pressed={active === id}
            onClick={() => {
              setCustomOpen(false);
              onChange(presetRange(id, today));
            }}
          >
            {t(`preset.${id}`)}
          </Button>
        ))}
        <Button
          size="sm"
          variant={active === null ? "default" : "outline"}
          aria-pressed={showCustom}
          onClick={() => setCustomOpen((open) => !open)}
        >
          {t("custom")}
        </Button>
      </div>
      {showCustom && (
        <CustomRange key={`${range.from}_${range.to}`} initial={range} onApply={onChange} />
      )}
    </div>
  );
}
