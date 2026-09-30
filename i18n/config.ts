export const locales = ["en", "pt"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** First supported language in an Accept-Language header, e.g. "pt-PT,pt;q=0.9,en;q=0.8" -> "pt". */
export function negotiateLocale(acceptLanguage: string | null | undefined): AppLocale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { lang: tag.trim().toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => isLocale(r.lang))?.lang as AppLocale | undefined ?? defaultLocale;
}

/** Regional BCP-47 tag used for Intl formatting (numbers, currency, dates). */
export const intlTag: Record<AppLocale, string> = {
  en: "en-GB",
  pt: "pt-PT",
};
