"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  IdCard,
  ChartColumn,
  ClipboardCheck,
  MessageSquareQuote,
  Hourglass,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "cn";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useReviewCount } from "@/features/bookings/hooks/useBookings";
import { usePendingQuotesCount } from "@/features/quotes/hooks/useQuotes";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type NavKey =
  | "dashboard"
  | "calendar"
  | "analytics"
  | "review"
  | "customers"
  | "quotes"
  | "waitlist"
  | "services"
  | "staff"
  | "settings";

interface NavEntry {
  href: string;
  labelKey: NavKey;
  icon: React.ElementType;
}

const NAV_ITEMS: NavEntry[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/analytics", labelKey: "analytics", icon: ChartColumn },
  { href: "/review", labelKey: "review", icon: ClipboardCheck },
  { href: "/quotes", labelKey: "quotes", icon: MessageSquareQuote },
  { href: "/waitlist", labelKey: "waitlist", icon: Hourglass },
  { href: "/customers", labelKey: "customers", icon: Users },
  { href: "/services", labelKey: "services", icon: Scissors },
  { href: "/staff", labelKey: "staff", icon: IdCard },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

// Review and analytics live in "More" on mobile; the dashboard banner is review's primary entry point there.
const MOBILE_MORE_ONLY: NavKey[] = ["review", "analytics", "waitlist"];
const MOBILE_TABS = NAV_ITEMS.filter((item) => !MOBILE_MORE_ONLY.includes(item.labelKey)).slice(0, 5);
const MOBILE_MORE = NAV_ITEMS.filter((item) => !MOBILE_TABS.includes(item));

function CountPill({ count, label, className }: { count: number; label: string; className?: string }) {
  return (
    <span
      aria-label={label}
      className={cn(
        "flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-bold leading-5 text-primary-foreground",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function PendingDot({ className }: { className?: string }) {
  const t = useTranslations("common.nav");
  const { data: count } = usePendingQuotesCount();
  if (!count) return null;
  return <CountPill count={count} label={t("pendingCount", { count })} className={className} />;
}

function ReviewDot({ className }: { className?: string }) {
  const t = useTranslations("common.nav");
  const { data: count } = useReviewCount();
  if (!count) return null;
  return <CountPill count={count} label={t("reviewCount", { count })} className={className} />;
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground",
        className
      )}
    >
      <CalendarDays className="size-4" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading text-xl font-semibold text-foreground", className)}>
      <span className="text-primary">Right</span>Schedule
    </span>
  );
}

function initialsOf(name?: string) {
  if (!name) return "RS";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function NavItem({
  href,
  labelKey,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  labelKey: NavKey;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
}) {
  const t = useTranslations("common.nav");
  const label = t(labelKey);
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {!collapsed && <span>{label}</span>}
      {!collapsed && labelKey === "quotes" && <PendingDot className="ml-auto" />}
      {!collapsed && labelKey === "review" && <ReviewDot className="ml-auto" />}
    </Link>
  );
}

export function Sidebar() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { data: business } = useBusiness();

  return (
    <aside
      className={cn(
        "flex h-dvh flex-col border-r border-border bg-card transition-[width] duration-200 motion-reduce:transition-none",
        collapsed ? "w-[4.5rem]" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <BrandMark />
        {!collapsed && <Wordmark />}
      </div>

      {business && (
        <div
          className="flex items-center gap-2.5 border-b border-border px-4 py-3"
          title={collapsed ? business.name : undefined}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {initialsOf(business.name)}
          </span>
          {!collapsed && <span className="min-w-0 truncate text-sm font-semibold">{business.name}</span>}
        </div>
      )}

      <nav aria-label={t("main")} className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-3">
        {!collapsed && <LanguageSwitcher className="w-full" />}
        <button
          type="button"
          onClick={logout}
          title={collapsed ? t("signOut") : undefined}
          aria-label={collapsed ? t("signOut") : undefined}
          className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          {!collapsed && <span>{t("signOut")}</span>}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-5" aria-hidden />
              <span>{t("collapseSidebar")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const { logout } = useAuth();
  const { data: business } = useBusiness();
  const [open, setOpen] = useState(false);
  const moreActive = MOBILE_MORE.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <BrandMark />
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t("more")}
          className={cn(
            "flex size-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground ring-2 ring-offset-2 ring-offset-card transition-shadow focus-visible:outline-none focus-visible:ring-ring",
            moreActive ? "ring-primary" : "ring-primary/20"
          )}
        >
          {initialsOf(business?.name)}
        </button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="gap-2 md:hidden">
          <SheetTitle className="mb-1">{business?.name ?? t("more")}</SheetTitle>
          <nav aria-label={t("more")} className="flex flex-col gap-1">
            {MOBILE_MORE.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-md px-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {t(labelKey)}
                  {labelKey === "review" && <ReviewDot className="ml-auto" />}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex min-h-12 items-center gap-3 rounded-md px-3 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-5" aria-hidden />
              {t("signOut")}
            </button>
            <LanguageSwitcher className="mt-1 h-12 w-full text-base" />
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MobileBottomNav() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("main")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "font-semibold text-primary" : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Icon className="size-6" strokeWidth={active ? 2.4 : 1.7} aria-hidden />
                {item.labelKey === "quotes" && (
                  <PendingDot className="absolute -right-2.5 -top-2 h-4 min-w-4 px-1 text-[0.6rem] leading-4" />
                )}
              </span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
