"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { cn } from "cn";
import { locales } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common.language");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={cn(
        "relative inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-card px-3 text-sm focus-within:ring-3 focus-within:ring-ring/50",
        pending && "opacity-60",
        className
      )}
    >
      <Languages className="size-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            await setLocale(next);
            router.refresh();
          });
        }}
        className="cursor-pointer bg-transparent pr-1 outline-none"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {t(l)}
          </option>
        ))}
      </select>
    </label>
  );
}
