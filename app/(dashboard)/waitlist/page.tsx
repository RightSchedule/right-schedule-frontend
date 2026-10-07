"use client";

import { Suspense, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Hourglass, Mail, Phone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListContainer,
  PageContainer,
  PageHeader,
  PaginationNav,
  SkeletonList,
} from "@/components/shared";
import { useServices } from "@/features/services/hooks/useServices";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { useRemoveWaitlistEntry, useWaitlistPage } from "@/features/waitlist/hooks/useWaitlist";
import { pageFromParam, pageToParam, useUrlParams } from "@/lib/hooks/useUrlParams";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { WaitlistEntry, WaitlistStatus } from "@/types/domain";

const FILTERS = ["ALL", "WAITING", "NOTIFIED", "BOOKED", "CANCELLED"] as const;
type Filter = (typeof FILTERS)[number];

function statusVariant(status: WaitlistStatus) {
  switch (status) {
    case "WAITING":
      return "pending" as const;
    case "NOTIFIED":
      return "warning" as const;
    case "BOOKED":
      return "success" as const;
    case "CANCELLED":
      return "secondary" as const;
  }
}

const hhmm = (time: string) => time.slice(0, 5);

function WaitlistContent() {
  const t = useTranslations("waitlist");
  const f = useLocaleFormat();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const { params, set } = useUrlParams();
  const rawFilter = params.get("status");
  const filter: Filter = FILTERS.find((k) => k === rawFilter) ?? "WAITING";
  const page = pageFromParam(params.get("page"));
  const setPage = (p: number) => set({ page: pageToParam(p) });
  const [toRemove, setToRemove] = useState<WaitlistEntry | null>(null);
  const status: WaitlistStatus | null = filter === "ALL" ? null : filter;
  const { data, isLoading, error, refetch, isPlaceholderData } = useWaitlistPage(status, page);
  const remove = useRemoveWaitlistEntry();
  const { data: services } = useServices();
  const { data: staff } = useStaff();
  const serviceNames = useMemo(() => new Map((services ?? []).map((s) => [s.id, s.name])), [services]);
  const staffNames = useMemo(() => new Map((staff ?? []).map((s) => [s.id, s.name])), [staff]);
  const entries = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  function timeWindow(e: WaitlistEntry) {
    if (e.fromTime && e.toTime) return t("list.timeRange", { from: hhmm(e.fromTime), to: hhmm(e.toTime) });
    if (e.fromTime) return t("list.timeFrom", { from: hhmm(e.fromTime) });
    if (e.toTime) return t("list.timeUntil", { to: hhmm(e.toTime) });
    return t("list.anyTime");
  }

  async function confirmRemove() {
    if (!toRemove) return;
    try {
      await remove.mutateAsync(toRemove.id);
      toast.success(t("remove.removed"));
      setToRemove(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <PageContainer>
      <PageHeader title={t("list.title")} description={t("list.description")} />

      <Tabs value={filter} onValueChange={(v) => set({ status: v === "WAITING" ? null : String(v), page: null })}>
        <TabsList aria-label={t("list.filters.label")} className="mb-5 w-full justify-start overflow-x-auto sm:w-fit">
          {FILTERS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`list.filters.${k === "ALL" ? "all" : k}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <SkeletonList className="h-20" />
      ) : error ? (
        <ErrorState error={error} feature={t("list.errorFeature")} onRetry={() => refetch()} />
      ) : entries.length === 0 && page === 0 ? (
        <EmptyState
          icon={Hourglass}
          title={filter === "ALL" ? t("list.emptyTitle") : t("list.emptyFilteredTitle")}
          description={filter === "ALL" ? t("list.emptyDescription") : t("list.emptyFilteredDescription")}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ListContainer>
            {entries.map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate text-base font-medium">{e.customerName}</p>
                    <Badge variant={statusVariant(e.status)} className="shrink-0">
                      {t(`status.${e.status}`)}
                    </Badge>
                  </div>
                  <p className="truncate text-xs font-medium text-primary">
                    {serviceNames.get(e.serviceId) ?? "—"} · {(e.staffId && staffNames.get(e.staffId)) || t("list.anyStaff")}
                  </p>
                  <p className="mt-0.5 text-sm">
                    {f.date(e.desiredDate, "EEE d MMM yyyy")} · {timeWindow(e)}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <a href={`mailto:${e.customerEmail}`} className="inline-flex items-center gap-1 break-all hover:underline">
                      <Mail className="size-3" aria-hidden /> {e.customerEmail}
                    </a>
                    {e.customerPhone && (
                      <a href={`tel:${e.customerPhone}`} className="inline-flex items-center gap-1 hover:underline">
                        <Phone className="size-3" aria-hidden /> {e.customerPhone}
                      </a>
                    )}
                    <span>{t("list.joined", { date: f.date(e.createdAt, "d MMM") })}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("remove.action", { name: e.customerName })}
                  onClick={() => setToRemove(e)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ListContainer>

          <PaginationNav
            page={page}
            totalPages={totalPages}
            disabled={isPlaceholderData}
            onPageChange={setPage}
            label={t("list.pagination.label")}
            previousLabel={t("list.pagination.previous")}
            nextLabel={t("list.pagination.next")}
            pageLabel={t("list.pagination.page", { page: page + 1, total: totalPages })}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => {
          if (!open) setToRemove(null);
        }}
        title={t("remove.title")}
        description={t("remove.description", { name: toRemove?.customerName ?? "" })}
        confirmLabel={t("remove.confirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </PageContainer>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonList className="h-20" />
        </PageContainer>
      }
    >
      <WaitlistContent />
    </Suspense>
  );
}
