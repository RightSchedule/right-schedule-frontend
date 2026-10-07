"use client";

import { useTranslations } from "next-intl";
import { Hourglass, ShieldAlert } from "lucide-react";
import { cn } from "cn";
import { useBusiness } from "@/features/business/hooks/useBusiness";

/** Shown on every dashboard page while the business is not live: awaiting approval, rejected or suspended. */
export function BusinessStatusBanner() {
  const t = useTranslations("common.businessStatus");
  const { data: business } = useBusiness();
  if (!business || business.status === "ACTIVE") return null;
  const pending = business.status === "PENDING_APPROVAL";
  const Icon = pending ? Hourglass : ShieldAlert;
  return (
    <div
      role={pending ? "status" : "alert"}
      className={cn(
        "flex gap-3 border-b px-4 py-3 sm:px-6",
        pending ? "border-warning/40 bg-warning-muted" : "border-destructive/30 bg-destructive/8"
      )}
    >
      <Icon
        className={cn("mt-0.5 size-5 shrink-0", pending ? "text-warning-foreground" : "text-destructive")}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-semibold">{t(`${business.status}.title`)}</p>
        <p className="text-sm text-muted-foreground">{t(`${business.status}.description`)}</p>
      </div>
    </div>
  );
}
