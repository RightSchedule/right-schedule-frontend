"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
  initials,
} from "@/components/shared";
import { QuoteDialog, QuoteStatusBadge } from "@/features/quotes/components/QuoteDialog";
import { useQuotesPage } from "@/features/quotes/hooks/useQuotes";
import { useServices } from "@/features/services/hooks/useServices";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { QuoteRequest, QuoteStatus } from "@/types/domain";

const FILTERS = ["ALL", "PENDING", "QUOTED", "DECLINED"] as const;
type Filter = (typeof FILTERS)[number];

export default function QuotesPage() {
  const t = useTranslations("quotes.list");
  const f = useLocaleFormat();
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const status: QuoteStatus | null = filter === "ALL" ? null : filter;
  const { data, isLoading, error, refetch, isPlaceholderData } = useQuotesPage(status, page);
  const { data: services } = useServices();
  const serviceNames = useMemo(
    () => new Map((services ?? []).map((s) => [s.id, s.name])),
    [services]
  );
  const requests = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const serviceName = (r: QuoteRequest) =>
    (r.serviceId && serviceNames.get(r.serviceId)) || t("generalRequest");

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as Filter);
          setPage(0);
        }}
      >
        <TabsList aria-label={t("filters.label")} className="mb-5 w-full justify-start overflow-x-auto sm:w-fit">
          {FILTERS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`filters.${k === "ALL" ? "all" : k}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} feature={t("errorFeature")} onRetry={() => refetch()} />
      ) : requests.length === 0 && page === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title={filter === "ALL" ? t("emptyTitle") : t("emptyFilteredTitle")}
          description={filter === "ALL" ? t("emptyDescription") : t("emptyFilteredDescription")}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            {requests.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <Avatar className="size-11">
                    <AvatarFallback>{initials(r.customerName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[0.95rem] font-semibold">{r.customerName}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {f.date(r.createdAt, "d MMM")}
                      </span>
                    </div>
                    <p className="truncate text-xs font-medium text-primary">{serviceName(r)}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  <QuoteStatusBadge status={r.status} className="shrink-0" />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav aria-label={t("pagination.label")} className="flex items-center justify-between text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || isPlaceholderData}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft /> {t("pagination.previous")}
              </Button>
              <span className="text-muted-foreground" aria-live="polite">
                {t("pagination.page", { page: page + 1, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("pagination.next")} <ChevronRight />
              </Button>
            </nav>
          )}
        </div>
      )}

      <QuoteDialog
        request={selected}
        serviceName={selected ? serviceName(selected) : undefined}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </PageContainer>
  );
}
