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
  Ellipsis,
} from "lucide-react";
import { cn } from "cn";
import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useReviewCount } from "@/features/bookings/hooks/useBookings";
import { usePendingQuotesCount } from "@/features/quotes/hooks/useQuotes";
import { useWaitingCount } from "@/features/waitlist/hooks/useWaitlist";
import { useStoredFlag } from "@/lib/hooks/useStoredFlag";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

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

// Grouped by how often and why they are opened: the day, what waits on the owner, who and what is
// booked, then reporting and setup. Order is the order everywhere, including the mobile "More" sheet.
const NAV_GROUPS: NavEntry[][] = [
  [
    { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  ],
  [
    { href: "/review", labelKey: "review", icon: ClipboardCheck },
    { href: "/quotes", labelKey: "quotes", icon: MessageSquareQuote },
    { href: "/waitlist", labelKey: "waitlist", icon: Hourglass },
  ],
  [
    { href: "/customers", labelKey: "customers", icon: Users },
    { href: "/services", labelKey: "services", icon: Scissors },
    { href: "/staff", labelKey: "staff", icon: IdCard },
  ],
  [
    { href: "/analytics", labelKey: "analytics", icon: ChartColumn },
    { href: "/settings", labelKey: "settings", icon: Settings },
  ],
];
const NAV_ITEMS: NavEntry[] = NAV_GROUPS.flat();

// Four daily destinations plus an explicit "More" tab. Setup pages (services, staff, settings) and
// the queues that already surface on the dashboard live in "More".
const MOBILE_TAB_KEYS: NavKey[] = ["dashboard", "calendar", "customers", "quotes"];
const MOBILE_TABS = MOBILE_TAB_KEYS.map((key) => NAV_ITEMS.find((item) => item.labelKey === key)!);
const MOBILE_MORE = NAV_ITEMS.filter((item) => !MOBILE_TABS.includes(item));

function CountPill({ count, label, className }: { count: number; label: string; className?: string }) {
  return (
    <span
      aria-label={label}
      className={cn(
        "flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold leading-5 text-primary-foreground",
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

function WaitingDot({ className }: { className?: string }) {
  const t = useTranslations("common.nav");
  const { data: count } = useWaitingCount();
  if (!count) return null;
  return <CountPill count={count} label={t("waitingCount", { count })} className={className} />;
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
    <Tooltip content={label} disabled={!collapsed}>
    <Link
      href={href}
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
      {!collapsed && labelKey === "waitlist" && <WaitingDot className="ml-auto" />}
    </Link>
    </Tooltip>
  );
}

export function Sidebar() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useStoredFlag("rs.sidebar.collapsed");
  const { data: business } = useBusiness();

  return (
    <TooltipProvider delay={300}>
    <aside
      className={cn(
        "flex h-dvh flex-col border-r border-border bg-card transition-[width] duration-200 motion-reduce:transition-none",
        collapsed ? "w-[4.5rem]" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <Tooltip content={business?.name} disabled={!collapsed || !business}>
          <BrandMark />
        </Tooltip>
        {!collapsed && (
          <div className="min-w-0">
            <Wordmark className="block leading-6" />
            {business && (
              <span className="block truncate text-xs leading-4 text-muted-foreground">
                {business.name}
              </span>
            )}
          </div>
        )}
      </div>

      <nav aria-label={t("main")} className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_GROUPS.map((group, i) => (
          <Fragment key={group[0]!.href}>
            {i > 0 && <div aria-hidden className="mx-3 my-1.5 border-t border-border" />}
            {group.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={pathname.startsWith(item.href)}
                collapsed={collapsed}
              />
            ))}
          </Fragment>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-3">
        {!collapsed && <LanguageSwitcher className="w-full" />}
        <Tooltip content={t("signOut")} disabled={!collapsed}>
        <button
          type="button"
          onClick={logout}
          aria-label={collapsed ? t("signOut") : undefined}
          className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          {!collapsed && <span>{t("signOut")}</span>}
        </button>
        </Tooltip>
        <Tooltip content={t("expandSidebar")} disabled={!collapsed}>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
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
        </Tooltip>
      </div>
    </aside>
    </TooltipProvider>
  );
}

export function MobileTopBar() {
  const { data: business } = useBusiness();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 md:hidden">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
        <BrandMark />
        <Wordmark />
      </Link>
      {business && (
        <span className="min-w-0 truncate text-sm font-medium text-muted-foreground">{business.name}</span>
      )}
    </header>
  );
}

const MOBILE_TAB_CLASS =
  "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MobileBottomNav() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const { logout } = useAuth();
  const { data: business } = useBusiness();
  const { data: reviewCount } = useReviewCount();
  const { data: waitingCount } = useWaitingCount();
  const attention = (reviewCount ?? 0) + (waitingCount ?? 0);
  const [open, setOpen] = useState(false);
  const moreActive = MOBILE_MORE.some((item) => pathname.startsWith(item.href));

  return (
    <>
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
                className={cn(MOBILE_TAB_CLASS, active ? "font-semibold text-primary" : "text-muted-foreground")}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 1.7} aria-hidden />
                  {item.labelKey === "quotes" && (
                    <PendingDot className="absolute -right-3 -top-2.5 min-w-5 px-1 text-xs leading-5" />
                  )}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(MOBILE_TAB_CLASS, moreActive ? "font-semibold text-primary" : "text-muted-foreground")}
          >
            <span className="relative">
              <Ellipsis className="size-6" strokeWidth={moreActive ? 2.4 : 1.7} aria-hidden />
              {attention > 0 && (
                <CountPill
                  count={attention}
                  label={t("moreCount", { count: attention })}
                  className="absolute -right-3 -top-2.5 min-w-5 px-1 text-xs leading-5"
                />
              )}
            </span>
            <span>{t("more")}</span>
          </button>
        </div>
      </nav>

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
                  {labelKey === "waitlist" && <WaitingDot className="ml-auto" />}
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
