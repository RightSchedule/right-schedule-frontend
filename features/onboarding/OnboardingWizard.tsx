"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { ServiceForm } from "@/features/services/components/ServiceFormDialog";
import { StaffForm } from "@/features/staff/components/StaffFormDialog";
import {
  WorkingHoursEditor,
  defaultSchedule,
  scheduleToEntries,
  useValidateSchedule,
  type WeekSchedule,
} from "@/features/staff/components/WorkingHoursEditor";
import { BookingLinkCard } from "@/features/business/components/BookingLinkCard";
import { useBusiness, useCreateBusiness } from "@/features/business/hooks/useBusiness";
import { useCreateService, useServices } from "@/features/services/hooks/useServices";
import {
  useCreateStaff,
  useSetStaffServices,
  useSetWorkingHours,
} from "@/features/staff/hooks/useStaff";
import { ApiError } from "@/lib/api/client";
import { isLocale } from "@/i18n/config";
import { useErrorMessage } from "@/lib/i18n/errors";
import {
  SLUG_PATTERN,
  browserTimezone,
  slugify,
  timezones,
} from "@/lib/utils/booking-link";

type Step = "business" | "service" | "team" | "done";

const STEPS: { id: Exclude<Step, "done"> }[] = [
  { id: "business" },
  { id: "service" },
  { id: "team" },
];

function Progress({ step }: { step: Step }) {
  const t = useTranslations("onboarding");
  const current = step === "done" ? STEPS.length : STEPS.findIndex((s) => s.id === step);
  return (
    <ol
      className="flex w-full items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-card"
      aria-label={t("progress")}
    >
      {STEPS.map((s, i) => {
        const complete = i < current;
        const active = i === current;
        return (
          <li
            key={s.id}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full px-2 py-1.5",
              active && "bg-accent"
            )}
          >
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold",
                (complete || active) && "bg-primary text-primary-foreground",
                !complete && !active && "bg-muted text-muted-foreground"
              )}
            >
              {complete ? <Check className="size-3" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "truncate text-xs font-semibold",
                active ? "text-primary" : "text-muted-foreground",
                !active && "hidden sm:block"
              )}
            >
              {t(`steps.${s.id}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type Translator = ReturnType<typeof useTranslations<"onboarding">>;

function makeBusinessSchema(t: Translator) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameRequired")).max(255),
    slug: z
      .string()
      .min(3, t("validation.slugMin"))
      .max(60)
      .regex(SLUG_PATTERN, t("validation.slugPattern")),
    timezone: z.string().min(1),
  });
}

type BusinessValues = z.infer<ReturnType<typeof makeBusinessSchema>>;

function BusinessStep({ onDone }: { onDone: () => void }) {
  const t = useTranslations("onboarding");
  const errorMessage = useErrorMessage();
  const uiLocale = useLocale();
  const tActions = useTranslations("common.actions");
  const businessSchema = useMemo(() => makeBusinessSchema(t), [t]);
  const create = useCreateBusiness();
  const [zones] = useState(timezones);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: { name: "", slug: "", timezone: browserTimezone() },
  });

  const nameField = register("name");

  async function onSubmit(values: BusinessValues) {
    setError(null);
    try {
      await create.mutateAsync({
        ...values,
        ...(isLocale(uiLocale) ? { locale: uiLocale } : {}),
      });
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setFieldError("slug", { message: t("business.slugTaken") });
      } else {
        setError(errorMessage(e));
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label={t("business.name")} htmlFor="ob-name" error={errors.name?.message}>
        <Input
          id="ob-name"
          placeholder={t("business.namePlaceholder")}
          autoFocus
          aria-invalid={!!errors.name}
          {...nameField}
          onChange={(e) => {
            nameField.onChange(e);
            if (!slugTouched) {
              setValue("slug", slugify(e.target.value), { shouldValidate: false });
            }
          }}
        />
      </Field>
      <Field
        label={t("business.slug")}
        htmlFor="ob-slug"
        error={errors.slug?.message}
        hint={t("business.slugHint")}
      >
        <div className="flex items-center rounded-2xl border border-input bg-muted/40 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <span className="pl-3.5 text-sm text-muted-foreground">/b/</span>
          <input
            id="ob-slug"
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? "ob-slug-error" : "ob-slug-hint"}
            className="h-11 flex-1 bg-transparent px-1 pr-3.5 text-sm font-medium outline-none pointer-coarse:text-base"
            {...register("slug", { onChange: () => setSlugTouched(true) })}
          />
        </div>
      </Field>
      <Field label={t("business.timezone")} htmlFor="ob-timezone">
        <Select id="ob-timezone" {...register("timezone")}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </Select>
      </Field>
      <FormError message={error} />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {t("stepOf", { current: 1, total: STEPS.length })}
        </span>
        <LoadingButton type="submit" size="lg" loading={isSubmitting}>
          {tActions("continue")} <ArrowRight />
        </LoadingButton>
      </div>
    </form>
  );
}

function ServiceStep({
  onDone,
  onSkip,
}: {
  onDone: (serviceId: string) => void;
  onSkip: () => void;
}) {
  const t = useTranslations("common.actions");
  const create = useCreateService();
  return (
    <div className="flex flex-col gap-3">
      <ServiceForm
        submitLabel={t("continue")}
        onSubmit={async (values) => {
          const service = await create.mutateAsync(values);
          onDone(service.id);
        }}
      />
      <Button variant="ghost" onClick={onSkip} className="self-center text-muted-foreground">
        {t("skip")}
      </Button>
    </div>
  );
}

function TeamStep({
  serviceIds,
  onDone,
}: {
  serviceIds: string[];
  onDone: () => void;
}) {
  const t = useTranslations("onboarding");
  const tActions = useTranslations("common.actions");
  const createStaff = useCreateStaff();
  const setServices = useSetStaffServices();
  const setHours = useSetWorkingHours();
  const validateSchedule = useValidateSchedule();
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);

  return (
    <div className="flex flex-col gap-3">
      <StaffForm
        submitLabel={t("team.finish")}
        onSubmit={async (values) => {
          const problem = validateSchedule(schedule);
          if (problem) throw new Error(problem);
          const staff = await createStaff.mutateAsync(values);
          if (serviceIds.length > 0) {
            await setServices.mutateAsync({ id: staff.id, serviceIds });
          }
          const entries = scheduleToEntries(schedule);
          if (entries.length > 0) {
            await setHours.mutateAsync({ id: staff.id, entries });
          }
          onDone();
        }}
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("team.workingHours")}</p>
          <WorkingHoursEditor value={schedule} onChange={setSchedule} />
        </div>
      </StaffForm>
      <Button variant="ghost" onClick={onDone} className="self-center text-muted-foreground">
        {tActions("skip")}
      </Button>
    </div>
  );
}

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const business = useBusiness();
  const services = useServices();
  const [chosenStep, setStep] = useState<Step | null>(null);
  const [createdServiceIds, setCreatedServiceIds] = useState<string[]>([]);
  const step: Step | null =
    chosenStep ?? (business.isLoading ? null : business.data ? "service" : "business");

  if (step === null) {
    return <Skeleton className="h-96 rounded-3xl" />;
  }

  const serviceIds =
    createdServiceIds.length > 0
      ? createdServiceIds
      : (services.data ?? []).filter((s) => s.active).map((s) => s.id);

  return (
    <div>
      <div className="mb-5 flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-cta">
          <CalendarDays className="size-6" strokeWidth={2.2} />
        </div>
        {step !== "done" && <Progress step={step} />}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-pop sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t(`copy.${step}.title`)}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t(`copy.${step}.description`)}</p>
        </div>
        {step === "business" && <BusinessStep onDone={() => setStep("service")} />}
        {step === "service" && (
          <ServiceStep
            onDone={(id) => {
              setCreatedServiceIds([id]);
              setStep("team");
            }}
            onSkip={() => setStep("team")}
          />
        )}
        {step === "team" && <TeamStep serviceIds={serviceIds} onDone={() => setStep("done")} />}
        {step === "done" && (
          <div className="flex flex-col gap-4">
            {business.data && <BookingLinkCard slug={business.data.slug} />}
            <Button size="lg" className="w-full" onClick={() => router.push("/dashboard")}>
              {t("done.goToDashboard")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
