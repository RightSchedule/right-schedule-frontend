"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { BusinessStatusBadge } from "@/features/admin/components/StatusBadges";
import { useAdminBusinesses } from "@/features/admin/hooks/useAdmin";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { pageFromParam, pageToParam, useUrlParams } from "@/lib/hooks/useUrlParams";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { BusinessStatus } from "@/types/domain";

const STATUSES: BusinessStatus[] = ["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "REJECTED"];
const FILTERS = ["ALL", ...STATUSES] as const;

function BusinessesContent() {
  const t = useTranslations("admin.businesses");
  const tp = useTranslations("admin.pagination");
  const f = useLocaleFormat();
  const { params, set } = useUrlParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const rawStatus = params.get("status");
  const status = STATUSES.find((s) => s === rawStatus) ?? null;
  const page = pageFromParam(params.get("page"));
  const search = useDebouncedValue(query.trim());
  const { data, isLoading, error, refetch, isPlaceholderData } = useAdminBusinesses(search, status, page);
  const businesses = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const filtered = !!search || status !== null;

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              set({ q: e.target.value.trim() || null, page: null });
            }}
          />
        </div>
        <Tabs value={status ?? "ALL"} onValueChange={(v) => set({ status: v === "ALL" ? null : String(v), page: null })}>
          <TabsList aria-label={t("filters.label")} className="w-full justify-start overflow-x-auto sm:w-fit">
            {FILTERS.map((k) => (
              <TabsTrigger key={k} value={k}>
                {t(`filters.${k === "ALL" ? "all" : k}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState error={error} feature={t("errorFeature")} onRetry={() => refetch()} />
      ) : businesses.length === 0 && !filtered && page === 0 ? (
        <EmptyState icon={Building2} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : businesses.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("noMatch")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <ListContainer>
            {businesses.map((b) => (
              <EntityListRow
                key={b.id}
                name={b.name}
                href={`/admin/businesses/${b.id}`}
                trailing={<BusinessStatusBadge status={b.status} className="shrink-0" />}
              >
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-base font-medium">{b.name}</p>
                  <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">/{b.slug}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {t("row", { owner: b.ownerEmail, date: f.date(b.createdAt, "d MMM yyyy") })}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {t("stats", { staff: b.activeStaff, bookings: b.bookingsLast30Days })}
                </p>
              </EntityListRow>
            ))}
          </ListContainer>

          <PaginationNav
            page={page}
            totalPages={totalPages}
            disabled={isPlaceholderData}
            onPageChange={(p) => set({ page: pageToParam(p) })}
            label={tp("label")}
            previousLabel={tp("previous")}
            nextLabel={tp("next")}
            pageLabel={tp("page", { page: page + 1, total: totalPages })}
          />
        </div>
      )}
    </PageContainer>
  );
}

export default function AdminBusinessesPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonList />
        </PageContainer>
      }
    >
      <BusinessesContent />
    </Suspense>
  );
}
