"use client";

import { useTranslations } from "next-intl";
import { CalendarCheck, CircleCheck, CircleX, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types/domain";

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
