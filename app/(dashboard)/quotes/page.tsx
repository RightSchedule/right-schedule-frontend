"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquareQuote } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyState,
  EntityListRow,
  ErrorState,
  ListContainer,
  PageContainer,
  PageHeader,
  PaginationNav,
  SkeletonList,
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
        <SkeletonList className="h-20" />
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
          <ListContainer>
            {requests.map((r) => (
              <EntityListRow
                key={r.id}
                name={r.customerName}
                onClick={() => setSelected(r)}
                trailing={<QuoteStatusBadge status={r.status} className="shrink-0" />}
              >
                <div className="flex items-center gap-2">
                  <p className="truncate text-[0.95rem] font-semibold">{r.customerName}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {f.date(r.createdAt, "d MMM")}
                  </span>
                </div>
                <p className="truncate text-xs font-medium text-primary">{serviceName(r)}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</p>
              </EntityListRow>
            ))}
          </ListContainer>

          <PaginationNav
            page={page}
            totalPages={totalPages}
            disabled={isPlaceholderData}
            onPageChange={setPage}
            label={t("pagination.label")}
            previousLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
            pageLabel={t("pagination.page", { page: page + 1, total: totalPages })}
          />
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
