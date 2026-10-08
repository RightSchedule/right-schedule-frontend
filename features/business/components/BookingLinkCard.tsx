"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, ExternalLink, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { bookingPath, bookingUrl, quotePath, quoteUrl } from "@/lib/utils/booking-link";

type LinkKind = "booking" | "quote";

function LinkRow({
  slug,
  kind,
  variant,
}: {
  slug: string;
  kind: LinkKind;
  variant: "default" | "compact";
}) {
  const t = useTranslations("settings.bookingLink");
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const path = kind === "quote" ? quotePath(slug) : bookingPath(slug);
  const fullUrl = kind === "quote" ? quoteUrl(slug) : bookingUrl(slug);
  const url = fullUrl || path;
  const title = kind === "quote" ? t("quoteTitle") : t("title");
  const label = kind === "quote" ? t("quoteLabel") : t("label");
  const copiedToast = kind === "quote" ? t("quoteCopiedToast") : t("copiedToast");

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success(copiedToast);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  const urlBox = (
    <p className="truncate rounded-md border border-input bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
      {url}
    </p>
  );

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-sm font-semibold">{label}</p>
        {urlBox}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copyLink")}
          </Button>
          <Tooltip content={t("preview")} side="top">
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              aria-label={t("preview")}
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <Send />
            </a>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-semibold">{title}</p>
      {urlBox}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="lg" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copy")}
        </Button>
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ size: "lg" })}
        >
          <ExternalLink /> {t("preview")}
        </a>
      </div>
    </div>
  );
}

export function BookingLinkCard({
  slug,
  variant = "default",
}: {
  slug: string;
  variant?: "default" | "compact";
}) {
  return (
    <div className="flex flex-col gap-4">
      <LinkRow slug={slug} kind="booking" variant={variant} />
      <LinkRow slug={slug} kind="quote" variant={variant} />
    </div>
  );
}
