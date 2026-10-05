"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ErrorState, Field, FormError, LoadingButton } from "@/components/shared";
import { useBookingSettings, useUpdateBookingSettings } from "@/features/business/hooks/useBusiness";
import { useErrorMessage } from "@/lib/i18n/errors";

const SLOT_INTERVALS = [5, 10, 15, 20, 30, 60];
const MAX_MINUTES = 43200;

type Translator = ReturnType<typeof useTranslations<"settings.bookingRules">>;

function makeSchema(t: Translator) {
  const whole = (min: number, max: number, message: string) =>
    z.number({ error: message }).int(message).min(min, message).max(max, message);
  return z.object({
    minNoticeMinutes: whole(0, MAX_MINUTES, t("errors.minNotice")),
    maxAdvanceDays: whole(1, 730, t("errors.maxAdvance")),
    cancellationWindowMinutes: z
      .string()
      .refine(
        (v) => v.trim() === "" || (/^\d+$/.test(v.trim()) && Number(v) <= MAX_MINUTES),
        t("errors.cancellationWindow")
      ),
    slotIntervalMinutes: z.coerce.number().refine((v) => SLOT_INTERVALS.includes(v)),
  });
}

type FormValues = z.input<ReturnType<typeof makeSchema>>;

export function BookingRulesCard() {
  const t = useTranslations("settings.bookingRules");
  const tActions = useTranslations("common.actions");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const { data, isLoading, error, refetch } = useBookingSettings();
  const update = useUpdateBookingSettings();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => makeSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) {
      reset({
        minNoticeMinutes: data.minNoticeMinutes,
        maxAdvanceDays: data.maxAdvanceDays,
        cancellationWindowMinutes: data.cancellationWindowMinutes?.toString() ?? "",
        slotIntervalMinutes: data.slotIntervalMinutes,
      });
    }
  }, [data, reset]);

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const window = values.cancellationWindowMinutes.trim();
    try {
      await update.mutateAsync({
        minNoticeMinutes: values.minNoticeMinutes,
        maxAdvanceDays: values.maxAdvanceDays,
        cancellationWindowMinutes: window === "" ? null : Number(window),
        slotIntervalMinutes: Number(values.slotIntervalMinutes),
      });
      toast.success(t("saved"));
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-48 rounded-lg" />
      ) : error || !data ? (
        <ErrorState error={error ?? new Error(t("errors.load"))} onRetry={() => refetch()} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("minNotice")}
              htmlFor="rules-notice"
              hint={t("minNoticeHint")}
              error={errors.minNoticeMinutes?.message}
            >
              <Input
                id="rules-notice"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_MINUTES}
                aria-invalid={!!errors.minNoticeMinutes}
                {...register("minNoticeMinutes", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label={t("maxAdvance")}
              htmlFor="rules-advance"
              hint={t("maxAdvanceHint")}
              error={errors.maxAdvanceDays?.message}
            >
              <Input
                id="rules-advance"
                type="number"
                inputMode="numeric"
                min={1}
                max={730}
                aria-invalid={!!errors.maxAdvanceDays}
                {...register("maxAdvanceDays", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label={t("cancellationWindow")}
              htmlFor="rules-cancel"
              hint={t("cancellationWindowHint")}
              error={errors.cancellationWindowMinutes?.message}
            >
              <Input
                id="rules-cancel"
                inputMode="numeric"
                placeholder={t("noLimit")}
                aria-invalid={!!errors.cancellationWindowMinutes}
                {...register("cancellationWindowMinutes")}
              />
            </Field>
            <Field label={t("slotInterval")} htmlFor="rules-slot" hint={t("slotIntervalHint")}>
              <Select id="rules-slot" {...register("slotIntervalMinutes")}>
                {SLOT_INTERVALS.map((m) => (
                  <option key={m} value={m}>
                    {t("minutes", { count: m })}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <FormError message={formError} />
          <div className="flex justify-end">
            <LoadingButton type="submit" loading={update.isPending} disabled={!isDirty}>
              {tActions("saveChanges")}
            </LoadingButton>
          </div>
        </form>
      )}
    </section>
  );
}
