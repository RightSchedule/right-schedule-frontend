import { getLocale, getTranslations } from "next-intl/server";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import { defaultLocale, isLocale } from "@/i18n/config";
import { SUB_PROCESSORS } from "@/lib/legal";

export default async function SubProcessorsPage() {
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = await getTranslations("legal.subProcessors");
  return (
    <LegalDocument doc={{ title: t("title"), intro: t("intro"), sections: [] }}>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="pb-2 pr-4 font-semibold">{t("purpose")}</th>
              <th className="pb-2 pr-4 font-semibold">{t("provider")}</th>
              <th className="pb-2 pr-4 font-semibold">{t("region")}</th>
              <th className="pb-2 font-semibold">{t("transfer")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SUB_PROCESSORS.map((p) => (
              <tr key={p.provider}>
                <td className="py-2.5 pr-4">{p.purpose[locale]}</td>
                <td className="py-2.5 pr-4">{p.provider}</td>
                <td className="py-2.5 pr-4">{p.region}</td>
                <td className="py-2.5">{p.transfer[locale]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LegalDocument>
  );
}
