"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, Phone, SearchX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/components/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { isStatus } from "@/lib/api/client";
import { useErrorMessage } from "@/lib/i18n/errors";
import type { PublicBusiness } from "@/types/domain";

export function BusinessBadge({ business }: { business: PublicBusiness }) {
  return (
    <Link href={`/b/${business.slug}`} className="flex items-center gap-3">
      <Avatar className="size-11 rounded-md">
        {business.logoUrl && <AvatarImage src={business.logoUrl} alt="" />}
        <AvatarFallback className="rounded-md bg-primary font-semibold text-primary-foreground">
          {initials(business.name)}
        </AvatarFallback>
      </Avatar>
      <span className="font-semibold">{business.name}</span>
    </Link>
  );
}

export function BusinessContact({ business }: { business: PublicBusiness }) {
  if (!business.address && !business.phone) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {business.address && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {business.address}
        </span>
      )}
      {business.phone && (
        <a href={`tel:${business.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
          <Phone className="size-3.5" /> {business.phone}
        </a>
      )}
    </div>
  );
}

/** Shown in place of a public flow the business has switched off, with whatever contact details it has. */
export function FeatureClosed({
  business,
  kind,
}: {
  business: PublicBusiness;
  kind: "booking" | "quotes";
}) {
  const t = useTranslations("public.closed");
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center">
      <h1 className="type-title">{business.name}</h1>
      <p className="mt-4 text-lg font-medium">{t(`${kind}.title`)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t(`${kind}.description`)}</p>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <BusinessContact business={business} />
        {business.email && (
          <a href={`mailto:${business.email}`} className="text-primary hover:underline">
            {business.email}
          </a>
        )}
      </div>
    </main>
  );
}

export function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Skeleton className="mb-6 h-10 w-48" />
      <Skeleton className="mb-3 h-24 rounded-lg" />
      <Skeleton className="mb-3 h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}

const invalidLinkRecovery = {
  verifyEmail: { href: "/resend-verification", label: "resendVerification" },
  resetPassword: { href: "/forgot-password", label: "forgotPassword" },
} as const;

export type TokenLinkKind = keyof typeof invalidLinkRecovery | "booking" | "quote" | "waitlist";

/** Shown when an emailed token link is missing its token or the backend rejects the token. */
export function PublicInvalidLink({ kind }: { kind: TokenLinkKind }) {
  const t = useTranslations("public.shell.invalidLink");
  const recovery = kind === "verifyEmail" || kind === "resetPassword" ? invalidLinkRecovery[kind] : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <SearchX className="mb-4 size-6 text-muted-foreground" aria-hidden />
      <h1 className="type-section">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      {recovery ? (
        <Link href={recovery.href} className={buttonVariants({ className: "mt-6" })}>
          {t(recovery.label)}
        </Link>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{t("contactBusiness")}</p>
      )}
    </main>
  );
}

export function PublicNotFound({
  error,
  onRetry,
  tokenKind,
}: {
  error?: unknown;
  onRetry?: () => void;
  tokenKind?: TokenLinkKind;
}) {
  const t = useTranslations("public.shell.notFound");
  const tShell = useTranslations("public.shell.loadError");
  const tActions = useTranslations("common.actions");
  const errorMessage = useErrorMessage();

  if (tokenKind && (!error || isStatus(error, 404))) return <PublicInvalidLink kind={tokenKind} />;

  if (error && !isStatus(error, 404)) {
    return (
      <div role="alert" className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
        <SearchX className="mb-4 size-6 text-muted-foreground" />
        <h1 className="type-section">{tShell("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage(error)}</p>
        {onRetry && (
          <Button variant="outline" className="mt-6" onClick={onRetry}>
            {tActions("tryAgain")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <SearchX className="mb-4 size-6 text-muted-foreground" />
      <h1 className="type-section">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      <Link href="/login" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        {t("ownerSignIn")}
      </Link>
    </div>
  );
}
