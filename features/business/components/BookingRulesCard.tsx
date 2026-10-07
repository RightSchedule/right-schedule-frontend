"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ErrorState, Field, FormError, LoadingButton } from "@/components/shared";
import { useBookingSettings, useUpdateBookingSettings } from "@/features/business/hooks/useBusiness";
import { useErrorMessage } from "@/lib/i18n/errors";
import type { BookingSettings } from "@/types/domain";

const SLOT_INTERVALS = [5, 10, 15, 20, 30, 60];
const REMINDER_LEADS = [0, 2, 24];
const MAX_MINUTES = 43200;

type Translator = ReturnType<typeof useTranslations<"settings.bookingRules">>;

type Flag =
  | "publicBookingEnabled"
  | "quotesEnabled"
  | "waitlistEnabled"
  | "reviewsEnabled"
  | "showReviewsPublicly"
  | "notifyCustomerConfirmation"
  | "notifyBusinessNewBooking";
function optionalInt(min: number, max: number, message: string) {
  return z
    .string()
    .refine(
      (v) => v.trim() === "" || (/^\d+$/.test(v.trim()) && Number(v) >= min && Number(v) <= max),
      message
    );
}

function makeSchema(t: Translator) {
  const whole = (min: number, max: number, message: string) =>
    z.number({ error: message }).int(message).min(min, message).max(max, message);
  return z.object({
    minNoticeMinutes: whole(0, MAX_MINUTES, t("errors.minNotice")),
    maxAdvanceDays: whole(1, 730, t("errors.maxAdvance")),
    bufferMinutes: whole(0, 240, t("errors.buffer")),
    cancellationWindowMinutes: optionalInt(0, MAX_MINUTES, t("errors.cancellationWindow")),
    rescheduleWindowMinutes: optionalInt(0, MAX_MINUTES, t("errors.cancellationWindow")),
    slotIntervalMinutes: z.coerce.number().refine((v) => SLOT_INTERVALS.includes(v)),
    reminderLeadHours: z.coerce.number().refine((v) => REMINDER_LEADS.includes(v)),
    maxBookingsPerCustomerPerDay: optionalInt(1, 50, t("errors.perDay")),
    maxActiveBookingsPerCustomer: optionalInt(1, 100, t("errors.active")),
    publicBookingEnabled: z.boolean(),
    quotesEnabled: z.boolean(),
    waitlistEnabled: z.boolean(),
    reviewsEnabled: z.boolean(),
    showReviewsPublicly: z.boolean(),
    notifyCustomerConfirmation: z.boolean(),
    notifyBusinessNewBooking: z.boolean(),
  });
}

type FormValues = z.input<ReturnType<typeof makeSchema>>;

const toText = (n: number | null) => n?.toString() ?? "";
const fromText = (v: string) => (v.trim() === "" ? null : Number(v));

function toForm(d: BookingSettings): FormValues {
  return {
    minNoticeMinutes: d.minNoticeMinutes,
    maxAdvanceDays: d.maxAdvanceDays,
    bufferMinutes: d.bufferMinutes,
    cancellationWindowMinutes: toText(d.cancellationWindowMinutes),
    rescheduleWindowMinutes: toText(d.rescheduleWindowMinutes),
    slotIntervalMinutes: d.slotIntervalMinutes,
    reminderLeadHours: d.reminderLeadHours,
    maxBookingsPerCustomerPerDay: toText(d.maxBookingsPerCustomerPerDay),
    maxActiveBookingsPerCustomer: toText(d.maxActiveBookingsPerCustomer),
    publicBookingEnabled: d.publicBookingEnabled,
    quotesEnabled: d.quotesEnabled,
    waitlistEnabled: d.waitlistEnabled,
    reviewsEnabled: d.reviewsEnabled,
    showReviewsPublicly: d.showReviewsPublicly,
    notifyCustomerConfirmation: d.notifyCustomerConfirmation,
    notifyBusinessNewBooking: d.notifyBusinessNewBooking,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-medium">{label}</span>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

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
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) reset(toForm(data));
  }, [data, reset]);

  const flags = useWatch({ control });
  const flag = (name: Flag) => flags[name] ?? false;
  const setFlag = (name: Flag) => (value: boolean) =>
    setValue(name, value, { shouldDirty: true });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await update.mutateAsync({
        minNoticeMinutes: values.minNoticeMinutes,
        maxAdvanceDays: values.maxAdvanceDays,
        bufferMinutes: values.bufferMinutes,
        cancellationWindowMinutes: fromText(values.cancellationWindowMinutes),
        rescheduleWindowMinutes: fromText(values.rescheduleWindowMinutes),
        slotIntervalMinutes: Number(values.slotIntervalMinutes),
        reminderLeadHours: Number(values.reminderLeadHours) as BookingSettings["reminderLeadHours"],
        maxBookingsPerCustomerPerDay: fromText(values.maxBookingsPerCustomerPerDay),
        maxActiveBookingsPerCustomer: fromText(values.maxActiveBookingsPerCustomer),
        publicBookingEnabled: values.publicBookingEnabled,
        quotesEnabled: values.quotesEnabled,
        waitlistEnabled: values.waitlistEnabled,
        reviewsEnabled: values.reviewsEnabled,
        showReviewsPublicly: values.showReviewsPublicly,
        notifyCustomerConfirmation: values.notifyCustomerConfirmation,
        notifyBusinessNewBooking: values.notifyBusinessNewBooking,
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
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <Section title={t("sections.online")}>
            <ToggleRow
              label={t("publicBooking")}
              hint={t("publicBookingHint")}
              checked={flag("publicBookingEnabled")}
              onChange={setFlag("publicBookingEnabled")}
            />
            <ToggleRow
              label={t("quotes")}
              hint={t("quotesHint")}
              checked={flag("quotesEnabled")}
              onChange={setFlag("quotesEnabled")}
            />
            <ToggleRow
              label={t("waitlist")}
              hint={t("waitlistHint")}
              checked={flag("waitlistEnabled")}
              onChange={setFlag("waitlistEnabled")}
            />
            <ToggleRow
              label={t("reviews")}
              hint={t("reviewsHint")}
              checked={flag("reviewsEnabled")}
              onChange={setFlag("reviewsEnabled")}
            />
            <ToggleRow
              label={t("showReviews")}
              hint={t("showReviewsHint")}
              checked={flag("showReviewsPublicly")}
              onChange={setFlag("showReviewsPublicly")}
            />
          </Section>

          <Section title={t("sections.timing")}>
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
              <Field label={t("slotInterval")} htmlFor="rules-slot" hint={t("slotIntervalHint")}>
                <Select id="rules-slot" {...register("slotIntervalMinutes")}>
                  {SLOT_INTERVALS.map((m) => (
                    <option key={m} value={m}>
                      {t("minutes", { count: m })}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label={t("buffer")}
                htmlFor="rules-buffer"
                hint={t("bufferHint")}
                error={errors.bufferMinutes?.message}
              >
                <Input
                  id="rules-buffer"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={240}
                  aria-invalid={!!errors.bufferMinutes}
                  {...register("bufferMinutes", { valueAsNumber: true })}
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
              <Field
                label={t("rescheduleWindow")}
                htmlFor="rules-reschedule"
                hint={t("rescheduleWindowHint")}
                error={errors.rescheduleWindowMinutes?.message}
              >
                <Input
                  id="rules-reschedule"
                  inputMode="numeric"
                  placeholder={t("sameAsCancellation")}
                  aria-invalid={!!errors.rescheduleWindowMinutes}
                  {...register("rescheduleWindowMinutes")}
                />
              </Field>
            </div>
          </Section>

          <Section title={t("sections.limits")}>
            <p className="text-sm text-muted-foreground">{t("limitsHint")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t("perDay")}
                htmlFor="rules-per-day"
                error={errors.maxBookingsPerCustomerPerDay?.message}
              >
                <Input
                  id="rules-per-day"
                  inputMode="numeric"
                  placeholder={t("noLimit")}
                  aria-invalid={!!errors.maxBookingsPerCustomerPerDay}
                  {...register("maxBookingsPerCustomerPerDay")}
                />
              </Field>
              <Field
                label={t("activeLimit")}
                htmlFor="rules-active"
                error={errors.maxActiveBookingsPerCustomer?.message}
              >
                <Input
                  id="rules-active"
                  inputMode="numeric"
                  placeholder={t("noLimit")}
                  aria-invalid={!!errors.maxActiveBookingsPerCustomer}
                  {...register("maxActiveBookingsPerCustomer")}
                />
              </Field>
            </div>
          </Section>

          <Section title={t("sections.notifications")}>
            <ToggleRow
              label={t("notifyCustomer")}
              hint={t("notifyCustomerHint")}
              checked={flag("notifyCustomerConfirmation")}
              onChange={setFlag("notifyCustomerConfirmation")}
            />
            <ToggleRow
              label={t("notifyBusiness")}
              hint={t("notifyBusinessHint")}
              checked={flag("notifyBusinessNewBooking")}
              onChange={setFlag("notifyBusinessNewBooking")}
            />
            <Field label={t("reminder")} htmlFor="rules-reminder" hint={t("reminderHint")}>
              <Select id="rules-reminder" {...register("reminderLeadHours")}>
                {REMINDER_LEADS.map((h) => (
                  <option key={h} value={h}>
                    {h === 0 ? t("reminderOff") : t("reminderHours", { count: h })}
                  </option>
                ))}
              </Select>
            </Field>
          </Section>

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
