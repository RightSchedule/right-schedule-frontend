"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CustomerFormDialog } from "@/features/customers/components/CustomerFormDialog";
import { useCustomersPage } from "@/features/customers/hooks/useCustomers";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { pageFromParam, pageToParam, useUrlParams } from "@/lib/hooks/useUrlParams";

function CustomersContent() {
  const t = useTranslations("customers.list");
  const { params, set } = useUrlParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const page = pageFromParam(params.get("page"));
  const setPage = (p: number) => set({ page: pageToParam(p) });
  const [creating, setCreating] = useState(false);
  const search = useDebouncedValue(query.trim());
  const { data, isLoading, error, refetch, isPlaceholderData } = useCustomersPage(search, page);
  const customers = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> {t("newButton")}
          </Button>
        }
      />
      <CustomerFormDialog open={creating} onOpenChange={setCreating} />

      {isLoading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState error={error} feature={t("errorFeature")} onRetry={() => refetch()} />
      ) : customers.length === 0 && !search && page === 0 ? (
        <EmptyState
          icon={Users}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative">
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

          {customers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("noMatch", { query })}
            </p>
          ) : (
            <ListContainer>
              {customers.map((c) => (
                <EntityListRow key={c.id} name={c.name} href={`/customers/${c.id}`}>
                  <p className="truncate text-base font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.email, c.phone].filter(Boolean).join(" · ")}
                  </p>
                </EntityListRow>
              ))}
            </ListContainer>
          )}

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
    </PageContainer>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonList />
        </PageContainer>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
