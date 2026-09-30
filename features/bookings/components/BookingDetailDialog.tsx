"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CircleCheck, Clock, Mail, NotebookText, Phone, User, UserRound } from "lucide-react";
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
import { LoadingButton } from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import { morphFromRect } from "@/lib/utils/motion";
import { useUpdateBookingStatus } from "@/features/bookings/hooks/useBookingActions";
import type { Booking, BookingStatus } from "@/types/domain";

export function statusVariant(status: BookingStatus) {
  switch (status) {
    case "CONFIRMED":
      return "success" as const;
    case "CANCELLED":
      return "destructive" as const;
    case "NO_SHOW":
      return "warning" as const;
    case "COMPLETED":
      return "secondary" as const;
  }
}

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
  return (
    <Badge variant={statusVariant(status)} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}

function Row({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3.5 text-[0.95rem]">
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">{children}</div>
    </div>
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

  return (
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

            <div className="flex flex-col gap-4 border-y border-border py-5">
              <Row icon={Clock}>
                <span className="font-mono font-bold">
                  {booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}
                </span>
                {booking.service && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {t("duration", { minutes: booking.service.durationMinutes })} ·{" "}
                    {f.price(booking.service.price)}
                  </span>
                )}
              </Row>
              <Row icon={UserRound}>{booking.staff?.name ?? t("unassigned")}</Row>
              <Row icon={User}>
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
              </Row>
              {booking.customer?.phone && (
                <Row icon={Phone}>
                  <a href={`tel:${booking.customer.phone}`} className="hover:underline">
                    {booking.customer.phone}
                  </a>
                </Row>
              )}
              {booking.customer?.email && (
                <Row icon={Mail}>
                  <a href={`mailto:${booking.customer.email}`} className="break-all hover:underline">
                    {booking.customer.email}
                  </a>
                </Row>
              )}
              {booking.notes && (
                <Row icon={NotebookText}>
                  <p className="whitespace-pre-wrap">{booking.notes}</p>
                </Row>
              )}
            </div>

            {actionable ? (
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <LoadingButton
                  variant="destructive"
                  loading={mutation.isPending && mutation.variables?.action === "cancel"}
                  disabled={mutation.isPending}
                  onClick={() => run("cancel", t("toast.cancelled"))}
                >
                  {t("cancelBooking")}
                </LoadingButton>
                <Button
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => run("no-show", t("toast.noShow"))}
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
  );
}
