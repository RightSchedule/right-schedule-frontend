"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, CalendarX, Mail, NotebookText, Pencil, Phone, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog, EmptyState, ErrorState, PageContainer, initials } from "@/components/shared";
import {
  BookingDetailDialog,
  BookingStatusBadge,
} from "@/features/bookings/components/BookingDetailDialog";
import { useBookingsRange } from "@/features/bookings/hooks/useBookings";
import { CustomerFormDialog } from "@/features/customers/components/CustomerFormDialog";
import { useCustomer, useDeleteCustomer } from "@/features/customers/hooks/useCustomers";
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
  const bookings = useBookingsRange(undefined, undefined, { customerId });
  const router = useRouter();
  const toast = useToast();
  const remove = useDeleteCustomer();
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

  const history = [...(bookings.data ?? [])].sort((a, b) =>
    `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)
  );

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
            <div className="flex gap-2">
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

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("history.title")}
          </h2>
          {bookings.isLoading ? (
            <Skeleton className="h-40 rounded-3xl" />
          ) : bookings.error ? (
            <ErrorState
              error={bookings.error}
              feature={t("history.errorFeature")}
              onRetry={() => bookings.refetch()}
            />
          ) : history.length === 0 ? (
            <EmptyState icon={CalendarX} title={t("history.empty")} />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              {history.map((b) => (
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
            </ul>
          )}
        </>
      )}

      <BookingDetailDialog booking={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </PageContainer>
  );
}
