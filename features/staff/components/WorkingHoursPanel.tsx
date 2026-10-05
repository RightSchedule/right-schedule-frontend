"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ErrorState, FormError, LoadingButton } from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useSetWorkingHours, useWorkingHours } from "@/features/staff/hooks/useStaff";
import { WorkingHoursEditor, scheduleFromHours, scheduleToEntries, useValidateSchedule, type WeekSchedule } from "@/features/staff/components/WorkingHoursEditor";

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
  if (!schedule) return <Skeleton className="h-96 rounded-lg" />;

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
