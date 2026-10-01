"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpNarrowWide,
  CalendarX,
  Download,
  Mail,
  NotebookText,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListContainer,
  PageContainer,
  PaginationNav,
  initials,
} from "@/components/shared";
import {
  BookingDetailDialog,
  BookingStatusBadge,
} from "@/features/bookings/components/BookingDetailDialog";
import { useCustomerBookingsPage } from "@/features/bookings/hooks/useBookings";
import { CustomerFormDialog } from "@/features/customers/components/CustomerFormDialog";
import { useCustomer, useDeleteCustomer, useExportCustomer } from "@/features/customers/hooks/useCustomers";
import type { SortDirection } from "@/lib/api/bookings";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { Booking } from "@/types/domain";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  const t = useTranslations("customers.detail");
  const tCustomers = useTranslations("customers");
  const tc = useTranslations("common.actions");
  const errorMessage = useErrorMessage();
  const fmt = useLocaleFormat();
  const customer = useCustomer(customerId);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortDirection>("desc");
  const history = useCustomerBookingsPage(customerId, sort, page);
  const router = useRouter();
  const toast = useToast();
  const remove = useDeleteCustomer();
  const exportData = useExportCustomer();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function deleteCustomer() {
    try {
      await remove.mutateAsync(customerId);
      toast.success(t("deleted"));
      router.push("/customers");
    } catch (e) {
      setConfirmingDelete(false);
      toast.error(errorMessage(e));
    }
  }

  async function exportCustomerData() {
    if (!customer.data) return;
    try {
      await exportData.mutateAsync({ id: customerId, name: customer.data.name });
      toast.success(t("exported"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <PageContainer className="max-w-3xl">
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>

      {customer.isLoading ? (
        <Skeleton className="h-32 rounded-3xl" />
      ) : customer.error || !customer.data ? (
        <ErrorState
          error={customer.error ?? new Error(t("notFound"))}
          feature={tCustomers("list.errorFeature")}
          onRetry={() => customer.refetch()}
        />
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-base">{initials(customer.data.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {customer.data.name}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {customer.data.phone && (
                  <a
                    href={`tel:${customer.data.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Phone className="size-3.5" /> {customer.data.phone}
                  </a>
                )}
                {customer.data.email && (
                  <a
                    href={`mailto:${customer.data.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Mail className="size-3.5" /> {customer.data.email}
                  </a>
                )}
              </div>
              {customer.data.notes && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <NotebookText className="mt-0.5 size-3.5 shrink-0" />
                  <span className="whitespace-pre-wrap">{customer.data.notes}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={exportData.isPending} onClick={exportCustomerData}>
                <Download /> {t("export")}
              </Button>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil /> {tc("edit")}
              </Button>
              <Button variant="outline" onClick={() => setConfirmingDelete(true)}>
                <Trash2 /> {tc("delete")}
              </Button>
            </div>
          </div>

          <CustomerFormDialog open={editing} customer={customer.data} onOpenChange={setEditing} />
          <ConfirmDialog
            open={confirmingDelete}
            onOpenChange={setConfirmingDelete}
            title={t("deleteTitle", { name: customer.data.name })}
            description={t("deleteDescription")}
            confirmLabel={t("deleteConfirm")}
            destructive
            loading={remove.isPending}
            onConfirm={deleteCustomer}
          />

          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("history.title")}
            </h2>
            {(history.bookings?.length ?? 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSort((s) => (s === "desc" ? "asc" : "desc"));
                  setPage(0);
                }}
              >
                {sort === "desc" ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />}
                {sort === "desc" ? t("history.sortNewest") : t("history.sortOldest")}
              </Button>
            )}
          </div>
          {history.isLoading ? (
            <Skeleton className="h-40 rounded-3xl" />
          ) : history.error ? (
            <ErrorState
              error={history.error}
              feature={t("history.errorFeature")}
              onRetry={() => history.refetch()}
            />
          ) : (history.bookings ?? []).length === 0 && page === 0 ? (
            <EmptyState icon={CalendarX} title={t("history.empty")} />
          ) : (
            <div className="flex flex-col gap-4">
              <ListContainer>
                {(history.bookings ?? []).map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(b)}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{b.service?.name ?? t("history.fallbackService")}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fmt.date(b.date, "dd MMM yyyy")} · {b.startTime.slice(0, 5)}
                          {b.staff ? ` · ${b.staff.name}` : ""}
                        </p>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </button>
                  </li>
                ))}
              </ListContainer>

              <PaginationNav
                page={page}
                totalPages={history.totalPages}
                disabled={history.isPlaceholderData}
                onPageChange={setPage}
                label={tCustomers("list.pagination.label")}
                previousLabel={tCustomers("list.pagination.previous")}
                nextLabel={tCustomers("list.pagination.next")}
                pageLabel={tCustomers("list.pagination.page", {
                  page: page + 1,
                  total: history.totalPages,
                })}
              />
            </div>
          )}
        </>
      )}

      <BookingDetailDialog booking={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </PageContainer>
  );
}
