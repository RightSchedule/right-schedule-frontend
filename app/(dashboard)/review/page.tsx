"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { CalendarDays, CircleCheck, UserX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListContainer,
  LoadingButton,
  PageContainer,
  PageHeader,
  PaginationNav,
  SkeletonList,
} from "@/components/shared";
import { BookingDetailDialog } from "@/features/bookings/components/BookingDetailDialog";
import {
  useBulkCompleteBookings,
  useUpdateBookingStatus,
} from "@/features/bookings/hooks/useBookingActions";
import { useReviewBookings } from "@/features/bookings/hooks/useBookings";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import { businessToday } from "@/lib/utils/clock";
import type { Booking } from "@/types/domain";

type Action = "complete" | "no-show";

function ReviewRow({
  booking,
  daysAgo,
  selected,
  busyAction,
  disabled,
  onToggle,
  onOpen,
  onResolve,
}: {
  booking: Booking;
  daysAgo: number | null;
  selected: boolean;
  busyAction: string | null;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
  onOpen: () => void;
  onResolve: (action: Action) => void;
}) {
  const t = useTranslations("review");
  const f = useLocaleFormat();
  const name = booking.customer?.name || t("page.unknownCustomer");

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Checkbox
          checked={selected}
          onCheckedChange={(c) => onToggle(c === true)}
          aria-label={t("select.row", { name })}
        />
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${t("page.details")}: ${name}`}
          className="flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-warning-muted text-warning-foreground">
            <span className="text-xs font-bold uppercase leading-none">
              {f.date(booking.date, "d MMM")}
            </span>
            <span className="mt-1 font-mono text-sm font-bold leading-none">
              {booking.startTime.slice(0, 5)}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.95rem] font-semibold">{name}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {booking.service?.name ?? t("page.serviceFallback")}
              {booking.staff ? ` · ${booking.staff.name}` : ""}
            </span>
            {daysAgo !== null && (
              <span className="block text-xs font-medium text-warning-foreground">
                {t("page.ended", { days: daysAgo })}
              </span>
            )}
          </span>
        </button>
      </div>

      <div className="flex gap-2 pl-[2.2rem] sm:pl-0">
        <LoadingButton
          variant="outline"
          size="sm"
          loading={busyAction === "no-show"}
          disabled={disabled}
          onClick={() => onResolve("no-show")}
        >
          <UserX /> {t("actions.noShow")}
        </LoadingButton>
        <LoadingButton
          size="sm"
          loading={busyAction === "complete"}
          disabled={disabled}
          onClick={() => onResolve("complete")}
        >
          <CircleCheck /> {t("actions.complete")}
        </LoadingButton>
      </div>
    </li>
  );
}

export default function ReviewPage() {
  const t = useTranslations("review");
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const business = useBusiness();
  const today = businessToday(business.data?.timezone);

  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [detail, setDetail] = useState<Booking | null>(null);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [noShowTarget, setNoShowTarget] = useState<Booking | null>(null);

  const { bookings = [], totalPages, isLoading, isPlaceholderData, error, refetch } =
    useReviewBookings(page);
  const single = useUpdateBookingStatus();
  const bulk = useBulkCompleteBookings();

  // Resolving the last row of a later page leaves it empty; step back instead of showing a blank page.
  if (page > 0 && !isLoading && !isPlaceholderData && bookings.length === 0) {
    setPage(page - 1);
  }

  const selected = bookings.filter((b) => selectedIds.has(b.id));
  const allSelected = bookings.length > 0 && selected.length === bookings.length;
  const busy = single.isPending || bulk.isPending;

  function goToPage(next: number) {
    setPage(next);
    setSelectedIds(new Set());
  }

  function toggle(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function resolve(booking: Booking, action: Action) {
    try {
      await single.mutateAsync({ id: booking.id, action });
      toast.success(action === "complete" ? t("toast.completed") : t("toast.noShow"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function completeSelected() {
    const { succeeded, failed } = await bulk.mutateAsync(selected.map((b) => b.id));
    setConfirmingBulk(false);
    setSelectedIds(new Set());
    if (failed > 0) toast.error(t("toast.bulkPartial", { succeeded, failed }));
    else toast.success(t("toast.bulkCompleted", { count: succeeded }));
  }

  const daysAgo = (b: Booking) =>
    business.data ? Math.max(0, differenceInCalendarDays(parseISO(today), parseISO(b.date))) : null;

  return (
    <PageContainer>
      <PageHeader title={t("page.title")} description={t("page.description")} />

      {isLoading || business.isLoading ? (
        <SkeletonList className="h-20" />
      ) : error ? (
        <ErrorState error={error} feature={t("page.errorFeature")} onRetry={() => refetch()} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title={t("page.emptyTitle")}
          description={t("page.emptyDescription")}
          action={
            <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>
              <CalendarDays /> {t("page.openCalendar")}
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1 text-sm text-muted-foreground">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(c) =>
                setSelectedIds(c === true ? new Set(bookings.map((b) => b.id)) : new Set())
              }
              aria-label={t("select.all")}
            />
            <span aria-live="polite">
              {selected.length > 0 ? t("select.count", { count: selected.length }) : t("select.all")}
            </span>
          </div>

          <ListContainer>
            {bookings.map((b) => (
              <ReviewRow
                key={b.id}
                booking={b}
                daysAgo={daysAgo(b)}
                selected={selectedIds.has(b.id)}
                busyAction={single.isPending && single.variables?.id === b.id ? single.variables.action : null}
                disabled={busy}
                onToggle={(c) => toggle(b.id, c)}
                onOpen={() => setDetail(b)}
                onResolve={(action) => (action === "no-show" ? setNoShowTarget(b) : resolve(b, action))}
              />
            ))}
          </ListContainer>

          {selected.length > 0 && (
            <div className="sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-3 pl-5 shadow-lg md:bottom-4">
              <span className="text-sm font-semibold">{t("select.count", { count: selected.length })}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setSelectedIds(new Set())}>
                  {t("select.clear")}
                </Button>
                <Button size="sm" disabled={busy} onClick={() => setConfirmingBulk(true)}>
                  <CircleCheck /> {t("actions.completeSelected", { count: selected.length })}
                </Button>
              </div>
            </div>
          )}

          <PaginationNav
            page={page}
            totalPages={totalPages}
            disabled={isPlaceholderData}
            onPageChange={goToPage}
            label={t("pagination.label")}
            previousLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
            pageLabel={t("pagination.page", { page: page + 1, total: totalPages })}
          />
        </div>
      )}

      <BookingDetailDialog booking={detail} onOpenChange={(open) => !open && setDetail(null)} />

      <ConfirmDialog
        open={confirmingBulk}
        onOpenChange={setConfirmingBulk}
        title={t("bulk.title", { count: selected.length })}
        description={t("bulk.description")}
        confirmLabel={t("bulk.confirm")}
        loading={bulk.isPending}
        onConfirm={completeSelected}
      />

      <ConfirmDialog
        open={noShowTarget !== null}
        onOpenChange={(open) => !open && !single.isPending && setNoShowTarget(null)}
        title={t("noShowConfirm.title", { name: noShowTarget?.customer?.name || t("page.unknownCustomer") })}
        description={t("noShowConfirm.description")}
        confirmLabel={t("noShowConfirm.confirm")}
        loading={single.isPending}
        onConfirm={async () => {
          if (!noShowTarget) return;
          await resolve(noShowTarget, "no-show");
          setNoShowTarget(null);
        }}
      />
    </PageContainer>
  );
}
