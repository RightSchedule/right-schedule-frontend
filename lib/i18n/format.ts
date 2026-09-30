import { format, parseISO } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import { useLocale } from "next-intl";
import { defaultLocale, isLocale, type AppLocale } from "@/i18n/config";
import { formatPrice } from "@/lib/utils/currency";

const dateFnsLocales: Record<AppLocale, DateFnsLocale> = { en: enGB, pt };

function resolve(locale: string): AppLocale {
  return isLocale(locale) ? locale : defaultLocale;
}

/** date-fns `format` with the locale's month/weekday names. Accepts Date or ISO string. */
export function formatLocalized(date: Date | string, pattern: string, locale: string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: dateFnsLocales[resolve(locale)] });
}

/** Locale-bound formatters for components: `const f = useLocaleFormat(); f.date(d, "EEEE d MMMM")`. */
export function useLocaleFormat() {
  const locale = useLocale();
  return {
    locale,
    date: (date: Date | string, pattern: string) => formatLocalized(date, pattern, locale),
    price: (amount: number) => formatPrice(amount, locale),
  };
}
