export type DurationUnit = "minutes" | "hours" | "days";

export const DURATION_UNITS: DurationUnit[] = ["minutes", "hours", "days"];

export const UNIT_MINUTES: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

/** Largest unit that divides the value evenly, so stored minutes display as "2 hours" instead of "120". */
export function bestUnit(minutes: number | null | undefined): DurationUnit {
  if (minutes == null || !Number.isFinite(minutes) || minutes === 0) return "hours";
  if (minutes % UNIT_MINUTES.days === 0) return "days";
  if (minutes % UNIT_MINUTES.hours === 0) return "hours";
  return "minutes";
}

export function minutesToAmount(minutes: number, unit: DurationUnit): number {
  return minutes / UNIT_MINUTES[unit];
}

/** Rounded to 6 places so 1.1 hours is 66 minutes, not 66.00000000000001. */
export function amountToMinutes(amount: number, unit: DurationUnit): number {
  return Number((amount * UNIT_MINUTES[unit]).toFixed(6));
}

/** Count and unit for a sentence like "2 hours". Only whole counts, since the unit divides the value. */
export function describeDuration(minutes: number): { unit: DurationUnit; count: number } {
  const unit = bestUnit(minutes);
  return { unit, count: minutesToAmount(minutes, unit) };
}
