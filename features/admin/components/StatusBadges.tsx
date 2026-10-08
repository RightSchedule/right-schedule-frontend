"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { BusinessStatus, UserRole } from "@/types/domain";

const BUSINESS_VARIANT = {
  PENDING_APPROVAL: "warning",
  ACTIVE: "success",
  SUSPENDED: "destructive",
  REJECTED: "secondary",
} as const satisfies Record<BusinessStatus, string>;

export function BusinessStatusBadge({ status, className }: { status: BusinessStatus; className?: string }) {
  const t = useTranslations("admin.status");
  return (
    <Badge variant={BUSINESS_VARIANT[status]} className={className}>
      {t(status)}
    </Badge>
  );
}

export function AccountStatusBadge({ active, className }: { active: boolean; className?: string }) {
  const t = useTranslations("admin.status");
  return (
    <Badge variant={active ? "success" : "destructive"} className={className}>
      {t(active ? "ACTIVE" : "DISABLED")}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const t = useTranslations("admin.roles");
  return (
    <Badge variant={role === "PLATFORM_ADMIN" ? "default" : "secondary"} className={className}>
      {t(role)}
    </Badge>
  );
}
