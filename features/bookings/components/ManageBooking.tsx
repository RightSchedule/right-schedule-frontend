"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog, LoadingButton } from "@/components/shared";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import { WhenStep } from "@/features/bookings/components/wizard/WhenStep";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { PublicLoading, PublicNotFound } from "@/features/bookings/components/PublicShell";
import {
  useCancelManagedBooking,
  useManagedBooking,
  useRescheduleManagedBooking,
} from "@/features/bookings/hooks/useManagedBooking";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";

export function ManageBooking({ token }: { token: string }) {
  const t = useTranslations("public.manage");
  const f = useLocaleFormat();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const query = useManagedBooking(token);
  const cancel = useCancelManagedBooking(token);
  const reschedule = useRescheduleManagedBooking(token);

  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  if (query.isLoading) return <PublicLoading />;
  if (query.error || !query.data) {
    return <PublicNotFound error={query.error} onRetry={() => query.refetch()} tokenKind="booking" />;
  }
  const booking = query.data;

  const doCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast.success(t("cancelled"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
    setConfirmingCancel(false);
  };

  const doReschedule = async () => {
    if (!date || !time) return;
    try {
      await reschedule.mutateAsync(`${date}T${time}:00`);
      toast.success(t("rescheduled"));
      setMode("view");
      setDate(null);
      setTime(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <p className="text-sm text-muted-foreground">{booking.businessName}</p>
      <div className="mt-1 flex items-center gap-3">
        <h1 className="type-title">{t("title")}</h1>
        <BookingStatusBadge status={booking.status} />
      </div>

      <dl className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-sm">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
          <dt className="sr-only">{t("when")}</dt>
          <dd>{f.date(booking.startDateTime, "EEEE d MMMM yyyy")}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <dt className="sr-only">{t("time")}</dt>
          <dd>
            {f.date(booking.startDateTime, "HH:mm")} – {f.date(booking.endDateTime, "HH:mm")} ·{" "}
            {booking.serviceName}
          </dd>
        </div>
        {booking.staffName && (
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">{t("with")}</dt>
            <dd>{booking.staffName}</dd>
          </div>
        )}
      </dl>

      {mode === "view" ? (
        <>
          {!booking.canCancel && !booking.canReschedule && booking.status === "CONFIRMED" && (
            <p className="mt-4 text-sm text-muted-foreground">{t("locked")}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            {booking.canReschedule && (
              <Button variant="outline" onClick={() => setMode("reschedule")}>
                {t("reschedule")}
              </Button>
            )}
            {booking.canCancel && (
              <Button variant="destructive" onClick={() => setConfirmingCancel(true)}>
                {t("cancel")}
              </Button>
            )}
          </div>
        </>
      ) : (
        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold">{t("pickNewTime")}</h2>
          <WhenStep
            slug={booking.businessSlug}
            serviceId={booking.serviceId}
            partySize={1}
            staffId={booking.staffId ?? null}
            date={date}
            startTime={time}
            onDate={(d) => {
              setDate(d);
              setTime(null);
            }}
            onTime={setTime}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMode("view")}>
              {t("keep")}
            </Button>
            <LoadingButton disabled={!date || !time} loading={reschedule.isPending} onClick={doReschedule}>
              {t("confirmReschedule")}
            </LoadingButton>
          </div>
        </section>
      )}

      {booking.status === "COMPLETED" && <ReviewForm token={token} slug={booking.businessSlug} />}

      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t("cancelTitle")}
        description={t("cancelDescription")}
        confirmLabel={t("cancel")}
        cancelLabel={t("keep")}
        destructive
        loading={cancel.isPending}
        onConfirm={doCancel}
      />
    </main>
  );
}
