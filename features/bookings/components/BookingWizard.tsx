"use client";

import { ViewTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";
import { FormError } from "@/components/shared";
import { BusinessBadge, PublicLoading, PublicNotFound } from "@/features/bookings/components/PublicShell";
import { BookingTicket } from "@/features/bookings/components/BookingTicket";
import { PrivacyNoticeLink } from "@/features/legal/components/PrivacyNoticeLink";
import { useCreatePublicBooking } from "@/features/bookings/hooks/useCreatePublicBooking";
import { publicStaffOptions, usePublicStaff } from "@/features/bookings/hooks/usePublicStaff";
import { usePublicBusiness } from "@/features/bookings/hooks/usePublicBusiness";
import { WIZARD_STEPS, initialWizardState, wizardReducer, type WizardStep } from "@/features/bookings/store/bookingWizard";
import { type CustomerValues } from "@/features/bookings/schemas";
import { saveBookingSummary } from "@/features/bookings/summary";
import { businessToday } from "@/lib/utils/clock";
import { addMinutesToTime } from "@/lib/utils/date";
import { transition } from "@/lib/utils/motion";
import type { PublicService, PublicStaff } from "@/types/domain";
import { DetailsForm } from "@/features/bookings/components/wizard/DetailsForm";
import { OptionCard, PartyStep, ServiceStep, StaffStep } from "@/features/bookings/components/wizard/PickerSteps";
import { WhenStep } from "@/features/bookings/components/wizard/WhenStep";

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
  const { data: business, isLoading, error, refetch } = usePublicBusiness(slug);
  const createBooking = useCreatePublicBooking();
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [step, setStep] = useState<WizardStep>("service");

  const services = useMemo(() => business?.services ?? [], [business]);
  const service = services.find((s) => s.id === state.serviceId) ?? null;

  const staffQ = usePublicStaff(slug, state.serviceId);
  const staff = useMemo(() => staffQ.data ?? [], [staffQ.data]);
  const askStaff = staff.length > 1;
  const askParty = (service?.maxPartySize ?? 1) > 1;
  const steps = WIZARD_STEPS.filter(
    (s) => (s !== "staff" || askStaff) && (s !== "party" || askParty)
  );
  const partySize = state.partySize;
  const totalMinutes = service ? service.durationMinutes * partySize : 0;
  const totalPrice = service ? service.price * partySize : 0;

  const timezone = business?.timezone;
  const today = business ? businessToday(timezone) : null;

  const loadStaff = (serviceId: string): Promise<PublicStaff[]> =>
    queryClient.fetchQuery(publicStaffOptions(slug, serviceId)).catch(() => []);

  function applyService(s: PublicService, list: PublicStaff[], animate: boolean) {
    const apply = () => {
      dispatch({ type: "SET_SERVICE", serviceId: s.id });
      if (list.length === 1) dispatch({ type: "SET_STAFF", staffId: list[0]!.id });
    };
    const next: WizardStep =
      (s.maxPartySize ?? 1) > 1 ? "party" : list.length > 1 ? "staff" : "when";
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
  if (error || !business) return <PublicNotFound error={error} onRetry={() => refetch()} />;

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
      partySize,
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
      endTime: addMinutesToTime(state.startTime, totalMinutes),
      price: booking.totalPrice ?? totalPrice,
      partySize,
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
          price={totalPrice}
          durationMinutes={totalMinutes}
          partySize={partySize}
          staffName={showStaffInTicket ? staffName : undefined}
          date={step === "details" ? state.date : null}
          startTime={step === "details" ? state.startTime : null}
          endTime={
            step === "details" && state.startTime
              ? addMinutesToTime(state.startTime, totalMinutes)
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
            className="mb-5 text-2xl font-semibold outline-none"
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

          {step === "party" && service && (
            <PartyStep
              service={service}
              value={partySize}
              onChange={(n) => dispatch({ type: "SET_PARTY_SIZE", partySize: n })}
              onContinue={() => move(askStaff ? "staff" : "when")}
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
              partySize={partySize}
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
              <div className="flex flex-col gap-2">
                <p className="text-center text-xs text-muted-foreground">
                  {t("details.footer", { business: business.name })}
                </p>
                <PrivacyNoticeLink slug={slug} business={business.name} />
              </div>
            </div>
          )}
        </div>
      </ViewTransition>
    </main>
  );
}
