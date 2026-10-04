"use client";

import { ViewTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import { cn } from "cn";
import { useLocaleFormat } from "@/lib/i18n/format";

export const ticketName = (serviceId: string | undefined) => `ticket-${serviceId ?? "booking"}`;

export function BookingTicket({
  serviceId,
  serviceName,
  price,
  durationMinutes,
  staffName,
  date,
  startTime,
  endTime,
  className,
}: {
  serviceId?: string;
  serviceName: string;
  price: number;
  durationMinutes?: number;
  staffName?: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  className?: string;
}) {
  const t = useTranslations("public");
  const f = useLocaleFormat();
  const showWhen = !!date && !!startTime;
  const showDetails = !!staffName || showWhen;

  return (
    <ViewTransition
      name={ticketName(serviceId)}
      share="vt-morph"
      update="vt-morph"
      enter="vt-rise"
      default="none"
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-card text-left text-sm",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold">{serviceName}</p>
            {durationMinutes ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" /> {t("service.duration", { count: durationMinutes })}
              </p>
            ) : null}
          </div>
          <p className="shrink-0 font-semibold tabular-nums text-primary">{f.price(price)}</p>
        </div>

        {showDetails && (
          <dl className="flex flex-col gap-2 border-t border-dashed border-border px-4 py-3 text-muted-foreground">
            {showWhen && (
              <div className="flex items-center gap-2">
                <dt className="sr-only">{t("ticket.when")}</dt>
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                <dd>
                  <span className="text-foreground">{f.date(date, "EEEE, d MMMM")}</span>
                  {" · "}
                  <span className="tabular-nums">
                    {startTime}
                    {endTime ? ` – ${endTime}` : ""}
                  </span>
                </dd>
              </div>
            )}
            {staffName && (
              <div className="flex items-center gap-2">
                <dt className="sr-only">{t("ticket.with")}</dt>
                <UserRound className="size-4 shrink-0" aria-hidden />
                <dd>{staffName}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </ViewTransition>
  );
}
