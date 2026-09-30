export const HOUR_PX = 64;

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Maps a vertical offset inside a day column to a slot start, snapped to `step` minutes. */
export function snapOffsetToTime(offsetY: number, firstHour: number, step = 15): string {
  const raw = firstHour * 60 + Math.floor(((Math.max(offsetY, 0) / HOUR_PX) * 60) / step) * step;
  const minutes = Math.min(raw, 24 * 60 - step);
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}
