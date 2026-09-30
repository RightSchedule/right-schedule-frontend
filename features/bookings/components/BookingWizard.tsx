"use client";

import { ViewTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { ArrowLeft, CalendarDays, Clock, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState, FormError, LoadingButton, initials } from "@/components/shared";
import {
  BusinessBadge,
  PublicLoading,
  PublicNotFound,
} from "@/features/bookings/components/PublicShell";
import { BookingTicket, ticketName } from "@/features/bookings/components/BookingTicket";
import { useAvailability } from "@/features/bookings/hooks/useAvailability";
import { CustomerFields } from "@/features/bookings/components/CustomerFields";
import { useCreatePublicBooking } from "@/features/bookings/hooks/useCreatePublicBooking";
import { publicStaffOptions, usePublicStaff } from "@/features/bookings/hooks/usePublicStaff";
import { usePublicBusiness } from "@/features/bookings/hooks/usePublicBusiness";
import {
  WIZARD_STEPS,
  initialWizardState,
  wizardReducer,
  type WizardStep,
} from "@/features/bookings/store/bookingWizard";
import { makePublicCustomerSchema, type CustomerValues } from "@/features/bookings/schemas";
import { saveBookingSummary } from "@/features/bookings/summary";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday } from "@/lib/utils/clock";
import { addMinutesToTime, dateFromISO } from "@/lib/utils/date";
import { transition } from "@/lib/utils/motion";
import type { PublicService, PublicStaff } from "@/types/domain";

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-3xl border-2 bg-card p-4 text-left shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-accent/60" : "border-transparent hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}

function ServiceStep({
  services,
  onSelect,
}: {
  services: PublicService[];
  onSelect: (s: PublicService) => void;
}) {
  const t = useTranslations("public");
  const { price } = useLocaleFormat();
  return (
    <ul className="flex flex-col gap-3">
      {services.map((s) => (
        <li key={s.id}>
          <ViewTransition name={ticketName(s.id)} share="vt-morph" default="none">
            <OptionCard onClick={() => onSelect(s)}>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.name}</p>
                {s.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                )}
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> {t("service.duration", { count: s.durationMinutes })}
                </p>
              </div>
              <span className="shrink-0 font-bold tabular-nums text-primary">{price(s.price)}</span>
            </OptionCard>
          </ViewTransition>
        </li>
      ))}
    </ul>
  );
}

function StaffStep({
  staff,
  selectedId,
  onSelect,
}: {
  staff: PublicStaff[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const t = useTranslations("public.wizard.staff");
  return (
    <ul className="flex flex-col gap-3">
      <li>
        <OptionCard selected={selectedId === null} onClick={() => onSelect(null)}>
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-medium">{t("any")}</p>
            <p className="text-sm text-muted-foreground">{t("anyHint")}</p>
          </div>
        </OptionCard>
      </li>
      {staff.map((s) => (
        <li key={s.id}>
          <OptionCard selected={selectedId === s.id} onClick={() => onSelect(s.id)}>
            <Avatar className="size-10">
              {s.photoUrl && <AvatarImage src={s.photoUrl} alt="" />}
              <AvatarFallback>{initials(s.name)}</AvatarFallback>
            </Avatar>
            <p className="font-medium">{s.name}</p>
          </OptionCard>
        </li>
      ))}
    </ul>
  );
}

type PartOfDay = "morning" | "afternoon" | "evening";

function partOfDay(time: string): PartOfDay {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function WhenStep({
  slug,
  timezone,
  serviceId,
  staffId,
  date,
  startTime,
  onDate,
  onTime,
}: {
  slug: string;
  timezone?: string;
  serviceId: string;
  staffId: string | null;
  date: string | null;
  startTime: string | null;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
}) {
  const t = useTranslations("public.wizard.when");
  const f = useLocaleFormat();
  const days = useMemo(() => {
    const today = dateFromISO(businessToday(timezone));
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, [timezone]);
  const availability = useAvailability({ slug, serviceId, staffId, date });

  const groups = useMemo(() => {
    const starts = [...new Set((availability.data?.slots ?? []).map((s) => s.start))].sort();
    const map = new Map<PartOfDay, string[]>();
    for (const time of starts) {
      const part = partOfDay(time);
      map.set(part, [...(map.get(part) ?? []), time]);
    }
    let offset = 0;
    return [...map.entries()].map(([label, times]) => {
      const group = { label, times, offset };
      offset += times.length;
      return group;
    });
  }, [availability.data]);

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label={t("chooseDate")}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {days.map((d) => {
          const value = format(d, "yyyy-MM-dd");
          const selected = value === date;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              aria-label={f.date(d, "EEEE d MMMM")}
              onClick={() => transition("date-pill", () => onDate(value))}
              className={cn(
                "relative isolate flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-2xl border py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {selected && (
                <ViewTransition name="date-pill" share="vt-pill" default="none">
                  <span aria-hidden className="absolute -inset-px -z-10 rounded-2xl bg-primary shadow-cta" />
                </ViewTransition>
              )}
              <span className={cn("text-xs font-medium uppercase", !selected && "text-muted-foreground")}>
                {f.date(d, "EEE")}
              </span>
              <span className="text-xl font-bold leading-none">{f.date(d, "d")}</span>
              <span className={cn("text-xs", !selected && "text-muted-foreground")}>{f.date(d, "MMM")}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {!date ? null : availability.isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-2xl" />
            ))}
          </div>
        ) : availability.error ? (
          <ErrorState error={availability.error} onRetry={() => availability.refetch()} />
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <CalendarDays className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">{t("noTimes")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("tryAnotherDay")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(({ label, times, offset }) => (
              <section key={label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(`partOfDay.${label}`)}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {times.map((time, i) => (
                    <button
                      key={time}
                      type="button"
                      aria-pressed={time === startTime}
                      onClick={() => onTime(time)}
                      style={{ "--i": offset + i } as React.CSSProperties}
                      className={cn(
                        "slot-in h-11 rounded-2xl border font-mono text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        time === startTime
                          ? "border-primary bg-primary text-primary-foreground shadow-cta"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailsForm({
  onSubmit,
  error,
}: {
  onSubmit: (v: CustomerValues) => Promise<void>;
  error: string | null;
}) {
  const t = useTranslations("public.wizard.details");
  const tValidation = useTranslations("public.validation");
  const schema = useMemo(() => makePublicCustomerSchema(tValidation), [tValidation]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <CustomerFields
        register={register}
        errors={errors}
        idPrefix="cust"
        emailHint={t("emailHint")}
      />
      <FormError message={error} />
      <LoadingButton type="submit" size="lg" loading={isSubmitting} className="h-11 w-full text-base">
        {t("submit")}
      </LoadingButton>
    </form>
  );
}

export function BookingWizard({
  slug,
  initialServiceId,
}: {
  slug: string;
  initialServiceId?: string;
}) {
  const t = useTranslations("public.wizard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: business, isLoading, error } = usePublicBusiness(slug);
  const createBooking = useCreatePublicBooking();
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [step, setStep] = useState<WizardStep>("service");

  const services = useMemo(() => business?.services ?? [], [business]);
  const service = services.find((s) => s.id === state.serviceId) ?? null;

  const staffQ = usePublicStaff(slug, state.serviceId);
  const staff = useMemo(() => staffQ.data ?? [], [staffQ.data]);
  const askStaff = staff.length > 1;
  const steps = WIZARD_STEPS.filter((s) => s !== "staff" || askStaff);

  const timezone = business?.timezone;
  const today = business ? businessToday(timezone) : null;

  const loadStaff = (serviceId: string): Promise<PublicStaff[]> =>
    queryClient.fetchQuery(publicStaffOptions(slug, serviceId)).catch(() => []);

  function applyService(s: PublicService, list: PublicStaff[], animate: boolean) {
    const apply = () => {
      dispatch({ type: "SET_SERVICE", serviceId: s.id });
      if (list.length === 1) dispatch({ type: "SET_STAFF", staffId: list[0]!.id });
    };
    const next: WizardStep = list.length > 1 ? "staff" : "when";
    if (animate) move(next, apply);
    else {
      apply();
      setStep(next);
    }
  }

  const selectService = (s: PublicService) => loadStaff(s.id).then((list) => applyService(s, list, true));

  const conflict = createBooking.conflict;
  useEffect(() => {
    if (conflict && step === "details") {
      move("when", () => state.date && dispatch({ type: "SET_DATE", date: state.date }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflict]);

  const preselectHandled = useRef(false);
  useEffect(() => {
    if (preselectHandled.current || !business || !initialServiceId) return;
    preselectHandled.current = true;
    const preselected = business.services.find((s) => s.id === initialServiceId);
    if (preselected) {
      void loadStaff(preselected.id).then((list) => applyService(preselected, list, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, initialServiceId]);

  useEffect(() => {
    if (step === "when" && !state.date && today) {
      dispatch({ type: "SET_DATE", date: today });
    }
  }, [step, state.date, today]);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStepRender = useRef(true);
  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  if (isLoading) return <PublicLoading />;
  if (error || !business) return <PublicNotFound />;

  const stepIndex = steps.indexOf(step);

  function move(next: WizardStep, before?: () => void) {
    const direction = WIZARD_STEPS.indexOf(next) >= WIZARD_STEPS.indexOf(step) ? "forward" : "back";
    transition(`step-${direction}`, () => {
      before?.();
      setStep(next);
    });
  }

  function back() {
    if (stepIndex <= 0) {
      router.push(`/b/${slug}`);
      return;
    }
    createBooking.reset();
    move(steps[stepIndex - 1]!);
  }

  const staffMember = staff.find((m) => m.id === state.staffId);
  const staffName = staffMember?.name ?? t("staff.any");

  async function submit(values: CustomerValues) {
    if (!service || !state.date || !state.startTime || !business) return;
    const date = state.date;
    const booking = await createBooking.submit({
      businessId: business.id,
      serviceId: service.id,
      staffId: state.staffId,
      date,
      time: state.startTime,
      customer: { name: values.name, phone: values.phone, email: values.email },
      locale,
    });
    if (!booking) return;
    saveBookingSummary({
      id: booking.id,
      businessName: business.name,
      serviceId: service.id,
      serviceName: service.name,
      staffName: staffMember?.name ?? null,
      date,
      startTime: state.startTime,
      endTime: addMinutesToTime(state.startTime, service.durationMinutes),
      price: service.price,
      customerName: values.name,
      customerEmail: values.email,
    });
    router.push(`/b/${slug}/confirmation?id=${booking.id}`);
  }

  const showStaffInTicket = step === "when" || step === "details";

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-12 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <BusinessBadge business={business} />
        <Link href={`/b/${slug}`} className="sr-only focus:not-sr-only">
          {t("exit")}
        </Link>
      </div>

      <div className="mb-5">
        <button
          type="button"
          onClick={back}
          className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> {tCommon("actions.back")}
        </button>
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={stepIndex + 1}
          aria-label={t("progress", { current: stepIndex + 1, total: steps.length })}
        >
          {steps.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-500",
                i <= stepIndex ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {service && step !== "service" && (
        <BookingTicket
          className="mb-5"
          serviceId={service.id}
          serviceName={service.name}
          price={service.price}
          durationMinutes={service.durationMinutes}
          staffName={showStaffInTicket ? staffName : undefined}
          date={step === "details" ? state.date : null}
          startTime={step === "details" ? state.startTime : null}
          endTime={
            step === "details" && state.startTime
              ? addMinutesToTime(state.startTime, service.durationMinutes)
              : null
          }
        />
      )}

      <ViewTransition
        key={step}
        enter={{ "step-forward": "vt-in-fwd", "step-back": "vt-in-back", default: "none" }}
        exit={{ "step-forward": "vt-out-fwd", "step-back": "vt-out-back", default: "none" }}
        default="none"
      >
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mb-5 text-2xl font-bold tracking-tight outline-none"
          >
            {t(`steps.${step}`)}
          </h1>

          {createBooking.error && step !== "details" && (
            <div className="mb-4">
              <FormError message={createBooking.error} />
            </div>
          )}

          {step === "service" && (
            <ServiceStep
              services={services}
              onSelect={(s) => void selectService(s)}
            />
          )}

          {step === "staff" && (
            <StaffStep
              staff={staff}
              selectedId={state.staffId}
              onSelect={(id) => move("when", () => dispatch({ type: "SET_STAFF", staffId: id }))}
            />
          )}

          {step === "when" && service && (
            <WhenStep
              slug={slug}
              timezone={timezone}
              serviceId={service.id}
              staffId={state.staffId}
              date={state.date}
              startTime={state.startTime}
              onDate={(d) => {
                createBooking.reset();
                dispatch({ type: "SET_DATE", date: d });
              }}
              onTime={(t) => {
                createBooking.reset();
                move("details", () => dispatch({ type: "SET_TIME", startTime: t }));
              }}
            />
          )}

          {step === "details" && service && state.date && state.startTime && (
            <div className="flex flex-col gap-6">
              <DetailsForm onSubmit={submit} error={createBooking.error} />
              <p className="text-center text-xs text-muted-foreground">
                {t("details.footer", { business: business.name })}
              </p>
            </div>
          )}
        </div>
      </ViewTransition>
    </main>
  );
}
