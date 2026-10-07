"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { initials } from "@/components/shared";
import { stagger } from "@/lib/utils/motion";
import {
  BusinessContact,
  PublicLoading,
  PublicNotFound,
} from "@/features/bookings/components/PublicShell";
import { BusinessReviews } from "@/features/reviews/components/BusinessReviews";
import { usePublicBusiness } from "@/features/bookings/hooks/usePublicBusiness";
import { useLocaleFormat } from "@/lib/i18n/format";

export function BusinessLanding({ slug }: { slug: string }) {
  const t = useTranslations("public");
  const tQuotes = useTranslations("quotes");
  const { price } = useLocaleFormat();
  const { data: business, isLoading, error, refetch } = usePublicBusiness(slug);

  if (isLoading) return <PublicLoading />;
  if (error || !business) return <PublicNotFound error={error} onRetry={() => refetch()} />;

  const services = business.services;
  const bookingOpen = business.policy?.bookingEnabled !== false;
  const quotesOpen = business.policy?.quotesEnabled !== false;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <header className="mb-10 flex flex-col items-start border-b border-border pb-8">
        <div className="reveal mb-4" style={stagger(0)}>
          <Avatar className="size-16 rounded-md">
            {business.logoUrl && <AvatarImage src={business.logoUrl} alt="" />}
            <AvatarFallback className="rounded-md bg-primary text-xl font-semibold text-primary-foreground">
              {initials(business.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <h1 className="reveal text-3xl font-semibold" style={stagger(1)}>{business.name}</h1>
        <div className="reveal mt-3" style={stagger(2)}>
          <BusinessContact business={business} />
        </div>
        <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {bookingOpen && services.length > 0 && (
            <Link
              href={`/b/${slug}/booking`}
              className={buttonVariants({ size: "lg", className: "reveal h-12 w-full px-8 text-base sm:w-auto" })}
              style={stagger(3)}
            >
              {t("landing.book")}
            </Link>
          )}
          {quotesOpen && (
            <Link
              href={`/b/${slug}/quote`}
              className={buttonVariants({
                variant: bookingOpen && services.length > 0 ? "outline" : "default",
                size: "lg",
                className: "reveal h-12 w-full px-8 text-base sm:w-auto",
              })}
              style={stagger(3)}
            >
              {tQuotes("landing.cta")}
            </Link>
          )}
        </div>
      </header>

      <section aria-labelledby="services-heading">
        <h2
          id="services-heading"
          className="mb-1 font-sans text-sm font-semibold text-muted-foreground"
        >
          {t("landing.services")}
        </h2>
        {!bookingOpen ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("closed.booking.description")}
          </p>
        ) : services.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("landing.closed")}
          </p>
        ) : (
          <ul className="flex flex-col">
            {services.map((s, i) => (
              <li key={s.id} className="reveal border-t border-border first:border-t-0" style={stagger(i + 4)}>
                <Link
                  href={`/b/${slug}/booking?service=${s.id}`}
                  className="flex items-center gap-3 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.name}</p>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                    <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {t("service.duration", { count: s.durationMinutes })}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-primary">{price(s.price)}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {business.policy?.reviewsEnabled !== false && <BusinessReviews slug={slug} />}
    </main>
  );
}
