"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChartColumn, Info } from "lucide-react";
import { cn } from "cn";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, PageContainer, PageHeader } from "@/components/shared";
import { DateRangePicker } from "@/features/analytics/components/DateRangePicker";
import { FunnelBar } from "@/features/analytics/components/FunnelBar";
import { KpiCard } from "@/features/analytics/components/KpiCard";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { TopList } from "@/features/analytics/components/TopList";
import { useDashboard } from "@/features/analytics/hooks/useDashboard";
import { deltaRatio, presetRange, rangeProblem, type DateRange } from "@/features/analytics/range";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday } from "@/lib/utils/clock";
import type { DashboardResponse } from "@/types/api";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-3xl" />
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}

function DashboardContent({ data }: { data: DashboardResponse }) {
  const t = useTranslations("analytics");
  const f = useLocaleFormat();
  const { summary } = data;

  const serviceItems = data.topServices.map((s) => ({
    id: s.serviceId,
    name: s.name,
    detail: t("top.bookings", { count: s.completedBookings }),
    revenue: s.revenue,
    revenueLabel: f.price(s.revenue),
  }));
  const staffItems = data.topStaff.map((s) => ({
    id: s.staffId,
    name: s.name,
    detail: t("top.staffDetail", {
      count: s.completedBookings,
      hours: Math.round(s.completedMinutes / 6) / 10,
    }),
    revenue: s.revenue,
    revenueLabel: f.price(s.revenue),
  }));

  const onlyUnresolved = summary.completedBookings === 0 && data.funnel.confirmed > 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="px-1 text-sm text-muted-foreground">
        {t("page.comparing", {
          from: f.date(data.range.from, "d MMM yyyy"),
          to: f.date(data.range.to, "d MMM yyyy"),
          prevFrom: f.date(data.previousRange.from, "d MMM yyyy"),
          prevTo: f.date(data.previousRange.to, "d MMM yyyy"),
        })}
      </p>

      {onlyUnresolved && (
        <div
          role="note"
          className="flex items-start gap-3 rounded-3xl border border-border bg-info-muted p-4 text-sm text-info-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t("page.completedHint")}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("kpi.revenue")}
          value={f.price(summary.revenue)}
          delta={deltaRatio(summary.revenue, summary.previousRevenue)}
          secondary={t("kpi.projected", { amount: f.price(summary.projectedRevenue) })}
        />
        <KpiCard
          label={t("kpi.bookings")}
          value={String(summary.bookings)}
          delta={deltaRatio(summary.bookings, summary.previousBookings)}
          secondary={t("kpi.completed", { count: summary.completedBookings })}
        />
        <KpiCard
          label={t("kpi.averageTicket")}
          value={f.price(summary.averageTicket)}
          showDelta={false}
          secondary={t("kpi.averageTicketHint")}
        />
        <KpiCard
          label={t("kpi.cancellationRate")}
          value={f.percent(summary.cancellationRate)}
          showDelta={false}
          secondary={t("kpi.noShowRate", { rate: f.percent(summary.noShowRate) })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("chart.title")}</CardTitle>
        </CardHeader>
        <div className="px-3 pb-5 sm:px-5">
          <RevenueChart series={data.revenueSeries} granularity={data.granularity} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("funnel.title")}</CardTitle>
        </CardHeader>
        <div className="px-5 pb-6 sm:px-6">
          <FunnelBar funnel={data.funnel} total={summary.bookings} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TopList title={t("top.servicesTitle")} items={serviceItems} emptyLabel={t("top.empty")} />
        <TopList title={t("top.staffTitle")} items={staffItems} emptyLabel={t("top.empty")} />
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const t = useTranslations("analytics");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const business = useBusiness();

  const ready = Boolean(business.data);
  const today = businessToday(business.data?.timezone);

  // Anything invalid in the URL falls back to the default range so bad ranges never reach the API.
  const urlFrom = params.get("from");
  const urlTo = params.get("to");
  const range: DateRange =
    urlFrom && urlTo && rangeProblem(urlFrom, urlTo) === null
      ? { from: urlFrom, to: urlTo }
      : presetRange("30d", today);

  const dashboard = useDashboard(range.from, range.to, ready);

  function setRange(next: DateRange) {
    router.replace(`${pathname}?${new URLSearchParams({ from: next.from, to: next.to }).toString()}`, { scroll: false });
  }

  const data = dashboard.data;
  const initialLoading = business.isLoading || (ready && dashboard.isLoading);
  const error = business.error ?? (dashboard.isError ? dashboard.error : null);

  return (
    <PageContainer>
      <PageHeader title={t("page.title")} description={t("page.description")} />

      <div className="mb-5">
        {ready ? (
          <DateRangePicker range={range} today={today} onChange={setRange} />
        ) : (
          <Skeleton className="h-9 w-72 rounded-2xl" />
        )}
      </div>

      {initialLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState
          error={error}
          feature={t("page.errorFeature")}
          onRetry={() => (business.error ? business.refetch() : dashboard.refetch())}
        />
      ) : data && data.summary.bookings === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title={t("page.emptyTitle")}
          description={t("page.emptyDescription")}
        />
      ) : data ? (
        <div className={cn("transition-opacity", dashboard.isPlaceholderData && "opacity-60")} aria-busy={dashboard.isFetching}>
          <DashboardContent data={data} />
        </div>
      ) : null}
    </PageContainer>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <LoadingSkeleton />
        </PageContainer>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
