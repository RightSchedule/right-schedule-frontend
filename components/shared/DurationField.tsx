"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DURATION_UNITS,
  UNIT_MINUTES,
  amountToMinutes,
  bestUnit,
  type DurationUnit,
} from "@/lib/utils/duration";

/**
 * Amount plus unit that reads and writes whole minutes. Emits `null` for an empty amount when
 * `allowEmpty`, otherwise NaN so the form schema reports it. The unit is local state seeded from
 * the initial value, so remount with a new `key` when the value is replaced from outside.
 */
export function DurationField({
  id,
  value,
  onChange,
  allowEmpty,
  placeholder,
}: {
  id: string;
  value: number | null | undefined;
  onChange: (minutes: number | null) => void;
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  const t = useTranslations("common.duration");
  const [state, setState] = useState(() => {
    const unit = bestUnit(value);
    const known = value != null && Number.isFinite(value);
    return { unit, text: known ? String(value / UNIT_MINUTES[unit]) : "" };
  });

  function update(text: string, unit: DurationUnit) {
    setState({ text, unit });
    const trimmed = text.trim();
    if (trimmed === "") {
      onChange(allowEmpty ? null : Number.NaN);
      return;
    }
    const amount = Number(trimmed.replace(",", "."));
    onChange(Number.isFinite(amount) ? amountToMinutes(amount, unit) : Number.NaN);
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={state.text}
        onChange={(e) => update(e.target.value, state.unit)}
        className="min-w-0 flex-1"
      />
      <Select
        aria-label={t("unitLabel")}
        value={state.unit}
        onChange={(e) => update(state.text, e.target.value as DurationUnit)}
        className="w-32 shrink-0"
      >
        {DURATION_UNITS.map((u) => (
          <option key={u} value={u}>
            {t(`units.${u}`)}
          </option>
        ))}
      </Select>
    </div>
  );
}
