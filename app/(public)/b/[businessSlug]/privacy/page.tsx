"use client";

import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import { customerNotice } from "@/features/legal/content";
import { PublicLoading, PublicNotFound } from "@/features/bookings/components/PublicShell";
import { usePublicBusiness } from "@/features/bookings/hooks/usePublicBusiness";
import { defaultLocale, isLocale } from "@/i18n/config";

export default function BusinessPrivacyPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = use(params);
  const t = useTranslations("legal.nav");
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const { data: business, isLoading, error } = usePublicBusiness(businessSlug);

  if (isLoading) return <PublicLoading />;
  if (error || !business) return <PublicNotFound />;

  return (
    <LegalDocument
      doc={customerNotice(locale, business.name)}
      backHref={`/b/${businessSlug}`}
      backLabel={t("back")}
    />
  );
}
