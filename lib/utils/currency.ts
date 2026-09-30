import { intlTag, isLocale, defaultLocale } from "@/i18n/config";

export function formatPrice(amount: number, locale: string = defaultLocale): string {
  return new Intl.NumberFormat(intlTag[isLocale(locale) ? locale : defaultLocale], {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
