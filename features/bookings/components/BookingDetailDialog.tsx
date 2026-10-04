"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarCheck, CircleCheck, CircleX, Clock, Mail, NotebookText, Phone, TriangleAlert, User, UserRound, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, DetailsRow, LoadingButton } from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import { morphFromRect } from "@/lib/utils/motion";
import { useUpdateBookingStatus } from "@/features/bookings/hooks/useBookingActions";
import type { Booking, BookingStatus } from "@/types/domain";

export function statusVariant(status: BookingStatus) {
  switch (status) {
    case "CONFIRMED":
      return "secondary" as const;
    case "CANCELLED":
      return "destructive" as const;
    case "NO_SHOW":
      return "warning" as const;
    case "COMPLETED":
      return "success" as const;
  }
}

const STATUS_ICON = {
  CONFIRMED: CalendarCheck,
  COMPLETED: CircleCheck,
  CANCELLED: CircleX,
  NO_SHOW: UserX,
} as const;

export function useStatusLabel(): (status: BookingStatus) => string {
  const t = useTranslations("common.status");
  return (status) => t(status);
}

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const statusLabel = useStatusLabel();
  const Icon = STATUS_ICON[status];
  return (
    <Badge variant={statusVariant(status)} className={className}>
      <Icon aria-hidden />
      {statusLabel(status)}
    </Badge>
  );
}

export interface DialogOrigin {
  rect: DOMRect;
  el: HTMLElement;
}

export function BookingDetailDialog({
  booking,
  origin,
  onOpenChange,
}: {
  booking: Booking | null;
  origin?: DialogOrigin | null;
  onOpenChange: (open: boolean) => void;
}) {
  const popupRef = useCallback(
    (el: HTMLElement | null) => {
      if (el && origin) morphFromRect(el, origin.rect, origin.el);
    },
    [origin]
  );
  const t = useTranslations("calendar.detail");
  const tStatus = useTranslations("common.status");
  const f = useLocaleFormat();
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const mutation = useUpdateBookingStatus();
  const actionable = booking?.status === "CONFIRMED";
  const [confirming, setConfirming] = useState<"cancel" | "no-show" | null>(null);

  async function run(action: "cancel" | "complete" | "no-show", message: string) {
    if (!booking) return;
    try {
      await mutation.mutateAsync({ id: booking.id, action });
      toast.success(message);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function confirmAction() {
    if (!confirming) return;
    await run(confirming, confirming === "cancel" ? t("toast.cancelled") : t("toast.noShow"));
    setConfirming(null);
  }

  return (
    <>
    <Dialog open={!!booking} onOpenChange={onOpenChange}>
      <DialogContent ref={popupRef} className="max-w-md">
        {booking && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2.5">
                <DialogTitle>{booking.service?.name ?? t("fallbackTitle")}</DialogTitle>
                <BookingStatusBadge status={booking.status} />
              </div>
              <DialogDescription>
                {t("date", {
                  weekday: f.date(booking.date, "EEEE"),
                  day: f.date(booking.date, "d"),
                  month: f.date(booking.date, "MMMM"),
                  year: f.date(booking.date, "yyyy"),
                })}
              </DialogDescription>
            </DialogHeader>

            {actionable && booking.needsReviewAt && (
              <div role="status" className="flex items-start gap-3 rounded-md bg-warning-muted p-3.5 text-warning-foreground">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="text-sm">
                  <p className="font-semibold">{t("needsReviewTitle")}</p>
                  <p className="mt-0.5 opacity-90">{t("needsReviewDescription")}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 border-y border-border py-5">
              <DetailsRow icon={Clock}>
                <span className="font-mono font-semibold">
                  {booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}
                </span>
                {booking.service && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {t("duration", { minutes: booking.service.durationMinutes })} ·{" "}
                    {f.price(booking.service.price)}
                  </span>
                )}
              </DetailsRow>
              <DetailsRow icon={UserRound}>{booking.staff?.name ?? t("unassigned")}</DetailsRow>
              <DetailsRow icon={User}>
                {booking.customerId ? (
                  <Link
                    href={`/customers/${booking.customerId}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {booking.customer?.name}
                  </Link>
                ) : (
                  <span>
                    <span className="font-medium">{booking.customer?.name ?? t("unknownCustomer")}</span>
                    <span className="text-muted-foreground"> · {t("deletedCustomer")}</span>
                  </span>
                )}
              </DetailsRow>
              {booking.customer?.phone && (
                <DetailsRow icon={Phone}>
                  <a href={`tel:${booking.customer.phone}`} className="hover:underline">
                    {booking.customer.phone}
                  </a>
                </DetailsRow>
              )}
              {booking.customer?.email && (
                <DetailsRow icon={Mail}>
                  <a href={`mailto:${booking.customer.email}`} className="break-all hover:underline">
                    {booking.customer.email}
                  </a>
                </DetailsRow>
              )}
              {booking.notes && (
                <DetailsRow icon={NotebookText}>
                  <p className="whitespace-pre-wrap">{booking.notes}</p>
                </DetailsRow>
              )}
            </div>

            {actionable ? (
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button
                  variant="destructive"
                  disabled={mutation.isPending}
                  onClick={() => setConfirming("cancel")}
                >
                  {t("cancelBooking")}
                </Button>
                <Button
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => setConfirming("no-show")}
                >
                  {tStatus("NO_SHOW")}
                </Button>
                <LoadingButton
                  loading={mutation.isPending && mutation.variables?.action === "complete"}
                  disabled={mutation.isPending}
                  onClick={() => run("complete", t("toast.completed"))}
                >
                  <CircleCheck /> {t("complete")}
                </LoadingButton>
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={confirming !== null}
      onOpenChange={(open) => !open && !mutation.isPending && setConfirming(null)}
      title={confirming === "no-show" ? t("confirm.noShowTitle") : t("confirm.cancelTitle")}
      description={confirming === "no-show" ? t("confirm.noShowDescription") : t("confirm.cancelDescription")}
      confirmLabel={confirming === "no-show" ? t("confirm.noShowConfirm") : t("cancelBooking")}
      cancelLabel={t("confirm.keep")}
      destructive={confirming === "cancel"}
      loading={mutation.isPending}
      onConfirm={confirmAction}
    />
    </>
  );
}
