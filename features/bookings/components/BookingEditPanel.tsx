"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Field, LoadingButton } from "@/components/shared";
import { useRescheduleBooking, useUpdateBookingNotes } from "@/features/bookings/hooks/useBookingActions";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { useErrorMessage } from "@/lib/i18n/errors";
import { businessToday } from "@/lib/utils/clock";
import type { Booking } from "@/types/domain";

const NOTES_MAX = 1000;

export function BookingEditPanel({
  booking,
  mode,
  onDone,
}: {
  booking: Booking;
  mode: "reschedule" | "notes";
  onDone: (closeDialog: boolean, savedNotes?: string | null) => void;
}) {
  const t = useTranslations("calendar.detail.edit");
  const tActions = useTranslations("common.actions");
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const business = useBusiness().data;
  const staff = useStaff().data;
  const reschedule = useRescheduleBooking();
  const updateNotes = useUpdateBookingNotes();

  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.startTime.slice(0, 5));
  const [staffId, setStaffId] = useState(booking.staffId);
  const [notes, setNotes] = useState(booking.notes ?? "");

  const activeStaff = (staff ?? []).filter((s) => s.active || s.id === booking.staffId);
  const pending = reschedule.isPending || updateNotes.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "reschedule") {
        await reschedule.mutateAsync({
          id: booking.id,
          startDateTime: `${date}T${time}:00`,
          ...(staffId !== booking.staffId ? { staffId } : {}),
        });
        toast.success(t("rescheduled"));
        onDone(true);
      } else {
        const value = notes.trim() || null;
        await updateNotes.mutateAsync({ id: booking.id, notes: value });
        toast.success(t("notesSaved"));
        onDone(false, value);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
      {mode === "reschedule" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("date")} htmlFor="bk-date">
              <Input
                id="bk-date"
                type="date"
                required
                min={businessToday(business?.timezone)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label={t("time")} htmlFor="bk-time">
              <Input
                id="bk-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </Field>
          </div>
          <Field label={t("professional")} htmlFor="bk-staff">
            <Select id="bk-staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-muted-foreground">{t("rescheduleHint")}</p>
        </>
      ) : (
        <Field label={t("notes")} htmlFor="bk-notes" hint={t("notesCount", { count: notes.length, max: NOTES_MAX })}>
          <Textarea
            id="bk-notes"
            rows={4}
            maxLength={NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => onDone(false)}>
          {tActions("cancel")}
        </Button>
        <LoadingButton type="submit" loading={pending}>
          {tActions("save")}
        </LoadingButton>
      </div>
    </form>
  );
}
