"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { QuoteStatus } from "@/types/domain";

export function quoteStatusVariant(status: QuoteStatus) {
  switch (status) {
    case "PENDING":
      return "pending" as const;
    case "QUOTED":
      return "warning" as const;
    case "ACCEPTED":
      return "success" as const;
    case "CONVERTED":
      return "default" as const;
    case "DECLINED":
    case "CUSTOMER_DECLINED":
      return "secondary" as const;
  }
}

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const t = useTranslations("quotes.status");
  return (
    <Badge variant={quoteStatusVariant(status)} className={className}>
      {t(status)}
    </Badge>
  );
}
