"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState, ErrorState, Field, FormError, LoadingButton } from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday } from "@/lib/utils/clock";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useAddException, useDeleteException, useExceptions } from "@/features/staff/hooks/useStaff";
import type { ExceptionType } from "@/types/domain";

const EXCEPTION_TYPES: ExceptionType[] = ["VACATION", "PERSONAL", "OTHER"];

function AddTimeOffDialog({
  staffId,
  open,
  onOpenChange,
}: {
  staffId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("staff.timeOff.dialog");
  const tAdded = useTranslations("staff.timeOff");
  const tc = useTranslations("common.actions");
  const tTypes = useTranslations("staff.timeOff.types");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const add = useAddException();
  const { data: business } = useBusiness();
  const today = businessToday(business?.timezone);
  const [date, setDate] = useState(today);
  const [allDay, setAllDay] = useState(true);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [type, setType] = useState<ExceptionType>("VACATION");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDate(today);
      setAllDay(true);
      setType("VACATION");
      setReason("");
      setError(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return setError(t("errors.pickDate"));
    if (!allDay && end <= start) return setError(t("errors.endAfterStart"));
    setError(null);
    try {
      await add.mutateAsync({
        id: staffId,
        date,
        type,
        reason: reason.trim() || undefined,
        ...(allDay ? {} : { startTime: start, endTime: end }),
      });
      toast.success(tAdded("added"));
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("date")} htmlFor="off-date">
              <Input
                id="off-date"
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>
            <Field label={t("type")} htmlFor="off-type">
              <Select
                id="off-type"
                value={type}
                onChange={(e) => setType(e.target.value as ExceptionType)}
              >
                {EXCEPTION_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {tTypes(v)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={allDay} onCheckedChange={setAllDay} aria-label={t("allDay")} />
            {t("allDay")}
          </label>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("from")} htmlFor="off-start">
                <Input
                  id="off-start"
                  type="time"
                  step={900}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field label={t("until")} htmlFor="off-end">
                <Input
                  id="off-end"
                  type="time"
                  step={900}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </div>
          )}
          <Field label={t("note")} htmlFor="off-reason">
            <Input
              id="off-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("notePlaceholder")}
            />
          </Field>
          <FormError message={error} />
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
            <LoadingButton type="submit" loading={add.isPending}>
              {t("submit")}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TimeOffPanel({ staffId }: { staffId: string }) {
  const t = useTranslations("staff.timeOff");
  const tTypes = useTranslations("staff.timeOff.types");
  const errorMessage = useErrorMessage();
  const fmt = useLocaleFormat();
  const toast = useToast();
  const exceptions = useExceptions(staffId);
  const remove = useDeleteException();
  const [open, setOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function onDelete(exceptionId: string) {
    try {
      await remove.mutateAsync({ staffId, exceptionId });
      toast.success(t("removed"));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setRemovingId(null);
    }
  }

  const sorted = [...(exceptions.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> {t("add")}
        </Button>
      </div>

      {exceptions.isLoading ? (
        <Skeleton className="h-32 rounded-lg" />
      ) : exceptions.error ? (
        <ErrorState error={exceptions.error} onRetry={() => exceptions.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {sorted.map((ex) => (
            <li key={ex.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {fmt.date(ex.date, "EEE, d MMM yyyy")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {ex.startTime && ex.endTime
                    ? `${ex.startTime.slice(0, 5)} – ${ex.endTime.slice(0, 5)}`
                    : t("allDay")}
                  {ex.reason ? ` · ${ex.reason}` : ""}
                </p>
              </div>
              <Badge variant="secondary">{tTypes(ex.type)}</Badge>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("removeAria")}
                disabled={remove.isPending}
                onClick={() => setRemovingId(ex.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddTimeOffDialog staffId={staffId} open={open} onOpenChange={setOpen} />

      <ConfirmDialog
        open={removingId !== null}
        onOpenChange={(o) => !o && !remove.isPending && setRemovingId(null)}
        title={t("confirmRemove.title")}
        description={t("confirmRemove.description")}
        confirmLabel={t("confirmRemove.confirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() => removingId && onDelete(removingId)}
      />
    </div>
  );
}
