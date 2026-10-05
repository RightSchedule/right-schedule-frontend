"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "cn";

export function StarsDisplay({ value, className }: { value: number; className?: string }) {
  const t = useTranslations("reviews");
  return (
    <span role="img" aria-label={t("outOfFive", { rating: value })} className={cn("inline-flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn("size-4", n <= Math.round(value) ? "fill-warning-foreground text-warning-foreground" : "text-border")}
        />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const t = useTranslations("reviews");
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t("stars", { count: n })}
          onClick={() => onChange(n)}
          className="flex size-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            aria-hidden
            className={cn("size-7 transition-colors", n <= value ? "fill-warning-foreground text-warning-foreground" : "text-border")}
          />
        </button>
      ))}
    </div>
  );
}
