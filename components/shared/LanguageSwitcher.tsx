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
        "relative inline-flex h-9 items-center text-sm",
        pending && "opacity-60",
        className
      )}
    >
      <Languages
        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
        aria-hidden
      />
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
        className="h-full w-full cursor-pointer rounded-md border border-input bg-card pl-9 pr-3 transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
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
