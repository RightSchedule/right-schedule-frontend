"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { HOUR_PX } from "@/features/bookings/calendarGeometry";
import {
  initialSlot,
  minuteToTime,
  moveSlot,
  offRanges,
  type MinuteRange,
} from "@/features/bookings/calendarHours";

/**
 * Keyboard path for "click a time to add a booking". The day column becomes one tab stop; arrow
 * keys move a visible time marker, Enter adds a booking at that time. Mouse clicks are unchanged.
 */
export function useSlotCursor({
  firstHour,
  lastHour,
  nowMinute,
  enabled,
  label,
  onCreate,
}: {
  firstHour: number;
  lastHour: number;
  nowMinute: number | null;
  enabled: boolean;
  label: string;
  onCreate: (time: string) => void;
}) {
  const t = useTranslations("calendar.views");
  const helpId = useId();
  const [minute, setMinute] = useState<number | null>(null);
  const first = firstHour * 60;
  const last = lastHour * 60;

  if (!enabled) return { surfaceProps: {}, overlay: null };

  const surfaceProps = {
    tabIndex: 0,
    role: "group" as const,
    "aria-label": label,
    "aria-describedby": helpId,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      // Only keyboard focus shows the marker; a mouse click goes straight to the create dialog.
      if (e.target === e.currentTarget && e.currentTarget.matches(":focus-visible")) {
        setMinute((m) => m ?? initialSlot(nowMinute, first, last));
      }
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMinute(null);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      const current = minute ?? initialSlot(nowMinute, first, last);
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCreate(minuteToTime(current));
        return;
      }
      const next = moveSlot(current, e.key, first, last);
      if (next !== null) {
        e.preventDefault();
        setMinute(next);
      }
    },
  };

  const overlay = (
    <>
      <span id={helpId} className="sr-only">
        {t("slotHelp")}
      </span>
      <span aria-live="polite" className="sr-only">
        {minute !== null ? t("slotAnnounce", { time: minuteToTime(minute) }) : ""}
      </span>
      {minute !== null && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-primary"
          style={{ top: ((minute - first) / 60) * HOUR_PX }}
        >
          <span className="absolute left-1 top-0.5 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-xs font-medium text-primary-foreground">
            {minuteToTime(minute)}
          </span>
        </div>
      )}
    </>
  );

  return { surfaceProps, overlay };
}

/** Shades the hours a staff member is not working. Clicks pass through to the grid underneath. */
export function OffHours({
  working,
  firstHour,
  lastHour,
}: {
  working: MinuteRange[] | undefined;
  firstHour: number;
  lastHour: number;
}) {
  if (!working) return null;
  return (
    <>
      {offRanges(working, firstHour * 60, lastHour * 60).map((r) => (
        <div
          key={r.start}
          aria-hidden
          data-off-hours
          className="pointer-events-none absolute inset-x-0 bg-muted/70"
          style={{
            top: ((r.start - firstHour * 60) / 60) * HOUR_PX,
            height: ((r.end - r.start) / 60) * HOUR_PX,
          }}
        />
      ))}
    </>
  );
}
