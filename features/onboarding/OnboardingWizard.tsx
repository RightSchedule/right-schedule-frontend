"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
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
import { requiredName } from "@/lib/validation";
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
    <div className="w-full">
      <ol className="flex gap-1.5" aria-label={t("progress")}>
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            aria-current={i === current ? "step" : undefined}
            className={cn("h-1 flex-1 rounded-sm", i <= current ? "bg-primary" : "bg-border")}
          />
        ))}
      </ol>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {t(`steps.${STEPS[Math.min(current, STEPS.length - 1)].id}`)}
      </p>
    </div>
  );
}

type Translator = ReturnType<typeof useTranslations<"onboarding">>;

function makeBusinessSchema(t: Translator) {
  return z.object({
    name: requiredName(t("validation.nameRequired"), 2),
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
    control,
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
        <div className="flex items-center rounded-md border border-input bg-muted/40 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
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
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => (
            <Combobox
              id="ob-timezone"
              items={zones}
              value={field.value ?? ""}
              onValueChange={(zone) => field.onChange(zone)}
            />
          )}
        />
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
  const resumeStep: Step | null = business.isLoading
    ? null
    : !business.data
      ? "business"
      : services.isLoading
        ? null
        : (services.data?.length ?? 0) > 0
          ? "team"
          : "service";
  const step: Step | null = chosenStep ?? resumeStep;

  if (step === null) {
    return <Skeleton className="h-96 rounded-lg" />;
  }

  // With approval on, the link only works once platform staff approve the business.
  const copyKey = step === "done" && business.data?.status === "PENDING_APPROVAL" ? "pending" : step;

  const serviceIds =
    createdServiceIds.length > 0
      ? createdServiceIds
      : (services.data ?? []).filter((s) => s.active).map((s) => s.id);

  return (
    <div>
      {step !== "done" && (
        <div className="mb-8">
          <Progress step={step} />
        </div>
      )}

      <div>
        <div className="mb-6">
          <h1 className="type-title">{t(`copy.${copyKey}.title`)}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t(`copy.${copyKey}.description`)}</p>
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
