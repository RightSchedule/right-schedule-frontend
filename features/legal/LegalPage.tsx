import { getLocale, getTranslations } from "next-intl/server";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import { legalDocs, type LegalKind } from "@/features/legal/content";
import { defaultLocale, isLocale } from "@/i18n/config";
import { formatLocalized } from "@/lib/i18n/format";
import { LEGAL_UPDATED } from "@/lib/legal";

export async function LegalPage({ kind }: { kind: LegalKind }) {
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = await getTranslations("legal");
  return (
    <LegalDocument
      doc={legalDocs[kind][locale]}
      updated={t("lastUpdated", { date: formatLocalized(LEGAL_UPDATED, "d MMM yyyy", locale) })}
    />
  );
}
