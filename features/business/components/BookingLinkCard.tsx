"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, ExternalLink, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { bookingPath, bookingUrl } from "@/lib/utils/booking-link";

export function BookingLinkCard({
  slug,
  variant = "default",
}: {
  slug: string;
  variant?: "default" | "compact";
}) {
  const t = useTranslations("settings.bookingLink");
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const url = bookingUrl(slug) || bookingPath(slug);

  async function copy() {
    try {
      await navigator.clipboard.writeText(bookingUrl(slug));
      setCopied(true);
      toast.success(t("copiedToast"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  const urlBox = (
    <p className="truncate rounded-2xl border border-input bg-muted/40 px-4 py-3 font-mono text-[0.8rem] text-muted-foreground">
      {url}
    </p>
  );

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("label")}
        </p>
        {urlBox}
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copyLink")}
          </Button>
          <a
            href={bookingPath(slug)}
            target="_blank"
            rel="noreferrer"
            aria-label={t("preview")}
            title={t("preview")}
            className={buttonVariants({ variant: "outline", size: "icon-lg" })}
          >
            <Send />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm font-semibold">{t("title")}</p>
      {urlBox}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="lg" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copy")}
        </Button>
        <a
          href={bookingPath(slug)}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ size: "lg" })}
        >
          <ExternalLink className="size-4" /> {t("preview")}
        </a>
      </div>
    </div>
  );
}
