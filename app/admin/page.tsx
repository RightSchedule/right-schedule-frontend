"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Hourglass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState, PageContainer, PageHeader } from "@/components/shared";
import { KpiCard } from "@/features/analytics/components/KpiCard";
import { AuditList } from "@/features/admin/components/AuditList";
import { usePlatformOverview } from "@/features/admin/hooks/useAdmin";

const RECENT_ACTIVITY = 5;

export default function AdminOverviewPage() {
  const t = useTranslations("admin.overview");
  const { data, isLoading, error, refetch } = usePlatformOverview();

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      {isLoading ? (
        <Skeleton className="h-48 rounded-lg" />
      ) : error || !data ? (
        <ErrorState error={error} feature={t("errorFeature")} onRetry={() => refetch()} />
      ) : (
        <>
          {data.pendingBusinesses > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border-l-4 border-warning bg-warning-muted px-4 py-3">
              <Hourglass className="size-5 shrink-0 text-warning-foreground" aria-hidden />
              <p className="min-w-0 flex-1 font-medium">{t("pendingCallout", { count: data.pendingBusinesses })}</p>
              <Link href="/admin/businesses?status=PENDING_APPROVAL" className={buttonVariants({ size: "sm" })}>
                {t("review")}
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4 [&>*]:bg-card">
            <KpiCard
              label={t("businesses")}
              value={String(data.totalBusinesses)}
              showDelta={false}
              secondary={t("activeOf", { active: data.activeBusinesses })}
            />
            <KpiCard
              label={t("pending")}
              value={String(data.pendingBusinesses)}
              showDelta={false}
              secondary={t("pendingHint")}
            />
            <KpiCard
              label={t("suspended")}
              value={String(data.suspendedBusinesses)}
              showDelta={false}
              secondary={t("suspendedHint")}
            />
            <KpiCard
              label={t("newBusinesses")}
              value={String(data.newBusinessesLast30Days)}
              showDelta={false}
              secondary={t("last30Days")}
            />
            <KpiCard
              label={t("accounts")}
              value={String(data.totalUsers)}
              showDelta={false}
              secondary={t("accountsHint")}
            />
            <KpiCard
              label={t("disabledAccounts")}
              value={String(data.disabledUsers)}
              showDelta={false}
              secondary={t("disabledAccountsHint")}
            />
            <KpiCard
              label={t("newAccounts")}
              value={String(data.newUsersLast30Days)}
              showDelta={false}
              secondary={t("last30Days")}
            />
            <KpiCard
              label={t("bookings")}
              value={String(data.bookingsLast30Days)}
              showDelta={false}
              secondary={t("last30Days")}
            />
          </div>
        </>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="type-section">{t("recentActivity")}</h2>
          <Link
            href="/admin/audit"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t("viewAll")} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <AuditList limit={RECENT_ACTIVITY} />
      </section>
    </PageContainer>
  );
}
