"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, LayoutDashboard, LogOut, ScrollText, ShieldCheck, Users } from "lucide-react";
import { cn } from "cn";
import { ErrorState, PageContainer, SkeletonList } from "@/components/shared";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandMark, Wordmark } from "@/components/layout/Sidebar";
import { usePlatformOverview } from "@/features/admin/hooks/useAdmin";
import { homeForRole, useAccountProfile } from "@/features/auth/hooks/useAccount";
import { useAuth } from "@/features/auth/hooks/useAuth";

const NAV = [
  { href: "/admin", key: "overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/businesses", key: "businesses", icon: Building2, exact: false },
  { href: "/admin/users", key: "users", icon: Users, exact: false },
  { href: "/admin/audit", key: "audit", icon: ScrollText, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Back-office frame. Renders nothing admin-specific until the session is confirmed to be a platform admin;
 * anyone else is sent to their own home. The API enforces the same rule, this only avoids a broken screen.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin.nav");
  const tc = useTranslations("common.nav");
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const account = useAccountProfile();
  const role = account.data?.role;
  const allowed = role === "PLATFORM_ADMIN";
  const pending = usePlatformOverview(allowed).data?.pendingBusinesses ?? 0;

  useEffect(() => {
    if (role && !allowed) router.replace(homeForRole(role));
  }, [role, allowed, router]);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {tc("skipToContent")}
      </a>

      <aside className="hidden h-dvh w-60 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
          <BrandMark />
          <Wordmark />
        </div>
        <p className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" aria-hidden /> {t("backOffice")}
        </p>
        <nav aria-label={t("label")} className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV.map(({ href, key, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {t(key)}
                {key === "businesses" && pending > 0 && (
                  <span
                    aria-label={t("pendingCount", { count: pending })}
                    className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold leading-5 text-primary-foreground"
                  >
                    {pending > 99 ? "99+" : pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2 border-t border-border p-3">
          {account.data && (
            <p className="truncate px-1 text-xs text-muted-foreground" title={account.data.email}>
              {account.data.email}
            </p>
          )}
          <LanguageSwitcher className="w-full" />
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            {t("signOut")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-card md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-heading text-lg font-semibold">{t("backOffice")}</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label={t("signOut")}
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label={t("label")} className="flex gap-1 overflow-x-auto px-2 pb-2">
            {NAV.map(({ href, key, exact }) => {
              const active = isActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>
        </header>

        <main id="main" className="flex-1 overflow-y-auto">
          {allowed ? (
            children
          ) : account.error ? (
            <PageContainer>
              <ErrorState error={account.error} onRetry={() => account.refetch()} />
            </PageContainer>
          ) : (
            <PageContainer>
              <div aria-busy="true">
                <SkeletonList className="h-20" />
              </div>
            </PageContainer>
          )}
        </main>
      </div>
    </div>
  );
}
