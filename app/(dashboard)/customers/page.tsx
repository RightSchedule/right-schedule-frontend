"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
  initials,
} from "@/components/shared";
import { CustomerFormDialog } from "@/features/customers/components/CustomerFormDialog";
import { useCustomersPage } from "@/features/customers/hooks/useCustomers";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

export default function CustomersPage() {
  const t = useTranslations("customers.list");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
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
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-3xl" />
          ))}
        </div>
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
                setPage(0);
              }}
            />
          </div>

          {customers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("noMatch", { query })}
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              {customers.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/customers/${c.id}`}
                    className="flex items-center gap-3.5 p-4 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  >
                    <Avatar className="size-11">
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.95rem] font-semibold">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[c.email, c.phone].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

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
    </PageContainer>
  );
}
