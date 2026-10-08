"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { PageContainer, PageHeader } from "@/components/shared";

const TABS = [
  { href: "/settings", key: "business" },
  { href: "/settings/booking", key: "booking" },
  { href: "/settings/emails", key: "emails" },
  { href: "/settings/account", key: "account" },
] as const;

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("settings");
  const pathname = usePathname().replace(/\/$/, "") || "/";

  return (
    <PageContainer>
      <PageHeader title={t("header.title")} description={t("header.description")} />
      <nav
        aria-label={t("tabs.label")}
        className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
      >
        {TABS.map(({ href, key }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${key}`)}
            </Link>
          );
        })}
      </nav>
      <div className="max-w-2xl">{children}</div>
    </PageContainer>
  );
}
