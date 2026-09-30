"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { CalendarOff, Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EmptyState,
  ErrorState,
  Field,
  FormError,
  LoadingButton,
} from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import { useServices } from "@/features/services/hooks/useServices";
import {
  useAddException,
  useDeleteException,
  useExceptions,
  useSetStaffServices,
  useSetWorkingHours,
  useStaffServices,
  useWorkingHours,
} from "@/features/staff/hooks/useStaff";
import {
  WorkingHoursEditor,
  scheduleFromHours,
  scheduleToEntries,
  useValidateSchedule,
  type WeekSchedule,
} from "@/features/staff/components/WorkingHoursEditor";
import type { ExceptionType } from "@/types/domain";

export function StaffServicesPanel({ staffId }: { staffId: string }) {
  const t = useTranslations("staff.servicesPanel");
  const errorMessage = useErrorMessage();
  const { price } = useLocaleFormat();
  const toast = useToast();
  const services = useServices();
  const assigned = useStaffServices(staffId);
  const save = useSetStaffServices();
  const [edited, setEdited] = useState<Set<string> | null>(null);
  const selected = edited ?? (assigned.data ? new Set(assigned.data) : null);

  if (services.isLoading || assigned.isLoading || !selected) {
    if (services.error || assigned.error) {
      return (
        <ErrorState
          error={services.error ?? assigned.error}
          onRetry={() => {
            services.refetch();
            assigned.refetch();
          }}
        />
      );
    }
    return <Skeleton className="h-48 rounded-3xl" />;
  }

  const list = services.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Scissors}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
      />
    );
  }

  const dirty =
    assigned.data !== undefined &&
    (assigned.data.length !== selected.size || assigned.data.some((id) => !selected.has(id)));

  function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setEdited(next);
  }

  async function onSave() {
    try {
      await save.mutateAsync({ id: staffId, serviceIds: [...selected!] });
      toast.success(t("saved"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border rounded-3xl border border-border bg-card shadow-card">
        {list.map((service) => (
          <li key={service.id}>
            <label className="flex cursor-pointer items-center gap-3.5 p-4">
              <Checkbox
                checked={selected.has(service.id)}
                onCheckedChange={(c) => toggle(service.id, c === true)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.95rem] font-semibold">{service.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {t("summary", {
                    minutes: service.durationMinutes,
                    price: price(service.price),
                  })}
                </span>
              </span>
              {!service.active && <Badge variant="secondary">{t("hidden")}</Badge>}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-muted-foreground">{t("unsaved")}</span>}
        <LoadingButton size="lg" onClick={onSave} loading={save.isPending} disabled={!dirty}>
          {t("save")}
        </LoadingButton>
      </div>
    </div>
  );
}

export function WorkingHoursPanel({ staffId }: { staffId: string }) {
  const t = useTranslations("staff.hoursPanel");
  const errorMessage = useErrorMessage();
  const validateSchedule = useValidateSchedule();
  const toast = useToast();
  const hours = useWorkingHours(staffId);
  const save = useSetWorkingHours();
  const [edited, setSchedule] = useState<WeekSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const schedule = edited ?? (hours.data ? scheduleFromHours(hours.data) : null);

  if (hours.error) return <ErrorState error={hours.error} onRetry={() => hours.refetch()} />;
  if (!schedule) return <Skeleton className="h-96 rounded-3xl" />;

  async function onSave() {
    const problem = validateSchedule(schedule!);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    try {
      await save.mutateAsync({ id: staffId, entries: scheduleToEntries(schedule!) });
      toast.success(t("saved"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <WorkingHoursEditor value={schedule} onChange={setSchedule} />
      <FormError message={error} />
      <div className="flex justify-end">
        <LoadingButton size="lg" onClick={onSave} loading={save.isPending}>
          {t("save")}
        </LoadingButton>
      </div>
    </div>
  );
}

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
  const today = format(new Date(), "yyyy-MM-dd");
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
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

  async function onDelete(exceptionId: string) {
    try {
      await remove.mutateAsync({ staffId, exceptionId });
      toast.success(t("removed"));
    } catch (e) {
      toast.error(errorMessage(e));
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
        <Skeleton className="h-32 rounded-3xl" />
      ) : exceptions.error ? (
        <ErrorState error={exceptions.error} onRetry={() => exceptions.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card shadow-card">
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
                onClick={() => onDelete(ex.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddTimeOffDialog staffId={staffId} open={open} onOpenChange={setOpen} />
    </div>
  );
}
