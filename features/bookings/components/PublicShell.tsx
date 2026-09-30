"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, Phone, SearchX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/components/shared";
import { buttonVariants } from "@/components/ui/button";
import type { PublicBusiness } from "@/types/domain";

export function BusinessBadge({ business }: { business: PublicBusiness }) {
  return (
    <Link href={`/b/${business.slug}`} className="flex items-center gap-3">
      <Avatar className="size-11 rounded-2xl">
        {business.logoUrl && <AvatarImage src={business.logoUrl} alt="" />}
        <AvatarFallback className="rounded-2xl bg-primary font-bold text-primary-foreground">
          {initials(business.name)}
        </AvatarFallback>
      </Avatar>
      <span className="font-bold">{business.name}</span>
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

export function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Skeleton className="mb-6 h-10 w-48" />
      <Skeleton className="mb-3 h-24 rounded-3xl" />
      <Skeleton className="mb-3 h-24 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
    </div>
  );
}

export function PublicNotFound() {
  const t = useTranslations("public.shell.notFound");
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-5" />
      </div>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      <Link href="/login" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        {t("ownerSignIn")}
      </Link>
    </div>
  );
}
