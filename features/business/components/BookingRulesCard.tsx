"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ErrorState, Field, FormError } from "@/components/shared";
import { DurationField } from "@/components/shared/DurationField";
import { SaveBar } from "@/components/shared/SaveBar";
import {
  useBookingSettings,
  useUpdateBookingSettings,
} from "@/features/business/hooks/useBusiness";
import { useErrorMessage } from "@/lib/i18n/errors";
import { describeDuration } from "@/lib/utils/duration";
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
      message,
    );
}

function makeSchema(t: Translator) {
  const whole = (min: number, max: number, message: string) =>
    z.number({ error: message }).int(message).min(min, message).max(max, message);
  const window = (message: string) => whole(0, MAX_MINUTES, message).nullable();
  return z.object({
    minNoticeMinutes: whole(0, MAX_MINUTES, t("errors.minNotice")),
    maxAdvanceDays: whole(1, 730, t("errors.maxAdvance")),
    bufferMinutes: whole(0, 240, t("errors.buffer")),
    cancellationWindowMinutes: window(t("errors.cancellationWindow")),
    rescheduleWindowMinutes: window(t("errors.cancellationWindow")),
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
    cancellationWindowMinutes: d.cancellationWindowMinutes,
    rescheduleWindowMinutes: d.rescheduleWindowMinutes,
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

/** `booking` = online features, timing and limits; `emails` = notification switches. Both save the same settings. */
export type RulesPart = "booking" | "emails";

export function BookingRulesCard({ part }: { part: RulesPart }) {
  const t = useTranslations("settings.bookingRules");
  const { data, isLoading, error, refetch } = useBookingSettings();
  const [discards, setDiscards] = useState(0);

  if (isLoading) return <Skeleton className="h-48 rounded-lg" />;
  if (error || !data) {
    return <ErrorState error={error ?? new Error(t("errors.load"))} onRetry={() => refetch()} />;
  }
  // Remount when the server copy changes or edits are discarded so duration units re-derive.
  return (
    <RulesForm
      key={`${JSON.stringify(data)}:${discards}`}
      data={data}
      part={part}
      onDiscard={() => setDiscards((n) => n + 1)}
    />
  );
}

function RulesForm({
  data,
  part,
  onDiscard,
}: {
  data: BookingSettings;
  part: RulesPart;
  onDiscard: () => void;
}) {
  const t = useTranslations("settings.bookingRules");
  const tDuration = useTranslations("common.duration");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const update = useUpdateBookingSettings();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => makeSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toForm(data) });

  const flags = useWatch({ control });
  const flag = (name: Flag) => flags[name] ?? false;
  const setFlag = (name: Flag) => (value: boolean) => setValue(name, value, { shouldDirty: true });

  const validMinutes = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;
  const duration = (minutes: number) => {
    const { unit, count } = describeDuration(minutes);
    return tDuration(`format.${unit}`, { count });
  };
  const noticeHint = validMinutes(flags.minNoticeMinutes)
    ? flags.minNoticeMinutes === 0
      ? t("summary.noticeNone")
      : t("summary.notice", { duration: duration(flags.minNoticeMinutes) })
    : undefined;
  const cancelHint =
    validMinutes(flags.cancellationWindowMinutes) && flags.cancellationWindowMinutes > 0
      ? t("summary.cancel", { duration: duration(flags.cancellationWindowMinutes) })
      : t("summary.cancelNone");
  const rescheduleHint =
    flags.rescheduleWindowMinutes == null
      ? t("summary.rescheduleSame")
      : validMinutes(flags.rescheduleWindowMinutes) && flags.rescheduleWindowMinutes > 0
        ? t("summary.reschedule", { duration: duration(flags.rescheduleWindowMinutes) })
        : t("summary.rescheduleNone");

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await update.mutateAsync({
        minNoticeMinutes: values.minNoticeMinutes,
        maxAdvanceDays: values.maxAdvanceDays,
        bufferMinutes: values.bufferMinutes,
        cancellationWindowMinutes: values.cancellationWindowMinutes,
        rescheduleWindowMinutes: values.rescheduleWindowMinutes,
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {part === "booking" && (
        <>
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
                hint={noticeHint}
                error={errors.minNoticeMinutes?.message}
              >
                <Controller
                  control={control}
                  name="minNoticeMinutes"
                  render={({ field }) => (
                    <DurationField
                      id="rules-notice"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
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
                hint={cancelHint}
                error={errors.cancellationWindowMinutes?.message}
              >
                <Controller
                  control={control}
                  name="cancellationWindowMinutes"
                  render={({ field }) => (
                    <DurationField
                      id="rules-cancel"
                      allowEmpty
                      placeholder={t("noLimit")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <Field
                label={t("rescheduleWindow")}
                htmlFor="rules-reschedule"
                hint={rescheduleHint}
                error={errors.rescheduleWindowMinutes?.message}
              >
                <Controller
                  control={control}
                  name="rescheduleWindowMinutes"
                  render={({ field }) => (
                    <DurationField
                      id="rules-reschedule"
                      allowEmpty
                      placeholder={t("sameAsCancellation")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
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
        </>
      )}

      {part === "emails" && (
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
      )}

      <FormError message={formError} />
      <SaveBar dirty={isDirty} loading={update.isPending} onDiscard={onDiscard} />
    </form>
  );
}
