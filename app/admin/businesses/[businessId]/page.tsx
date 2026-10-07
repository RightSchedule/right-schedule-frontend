"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink, Hourglass, Mail, Phone, ShieldAlert } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog, ErrorState, PageContainer } from "@/components/shared";
import { AuditList } from "@/features/admin/components/AuditList";
import { ReasonDialog } from "@/features/admin/components/ReasonDialog";
import { AccountStatusBadge, BusinessStatusBadge } from "@/features/admin/components/StatusBadges";
import {
  useAdminBusiness,
  useApproveBusiness,
  useDisableUser,
  useEnableUser,
  useReactivateBusiness,
  useRejectBusiness,
  useSuspendBusiness,
} from "@/features/admin/hooks/useAdmin";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { AdminBusinessDetail } from "@/types/domain";

type Dialog = "approve" | "reject" | "suspend" | "reactivate" | "disableOwner" | "enableOwner" | null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function Usage({ business }: { business: AdminBusinessDetail }) {
  const t = useTranslations("admin.business");
  const f = useLocaleFormat();
  const figures: [string, number][] = [
    [t("activeStaff"), business.activeStaff],
    [t("activeServices"), business.activeServices],
    [t("customers"), business.customers],
    [t("totalBookings"), business.totalBookings],
    [t("bookings30d"), business.bookingsLast30Days],
    [t("upcomingBookings"), business.upcomingBookings],
  ];
  return (
    <Section title={t("usage")}>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {figures.map(([label, value]) => (
          <Fact key={label} label={label}>
            <span className="text-xl tabular-nums">{value}</span>
          </Fact>
        ))}
        <Fact label={t("lastBooking")}>
          {business.lastBookingCreatedAt ? f.date(business.lastBookingCreatedAt, "d MMM yyyy") : t("never")}
        </Fact>
      </dl>
    </Section>
  );
}

export default function AdminBusinessPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = use(params);
  const t = useTranslations("admin.business");
  const tu = useTranslations("admin.users");
  const tStatus = useTranslations("admin.status");
  const tList = useTranslations("admin.businesses");
  const f = useLocaleFormat();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const business = useAdminBusiness(businessId);
  const approve = useApproveBusiness();
  const reject = useRejectBusiness();
  const suspend = useSuspendBusiness();
  const reactivate = useReactivateBusiness();
  const disableOwner = useDisableUser();
  const enableOwner = useEnableUser();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  function open(next: Dialog) {
    setDialogError(null);
    setDialog(next);
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
      setDialog(null);
    } catch (e) {
      setDialogError(errorMessage(e));
    }
  }

  const b = business.data;

  return (
    <PageContainer className="max-w-4xl">
      <Link
        href="/admin/businesses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>

      {business.isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : business.error || !b ? (
        <ErrorState
          error={business.error ?? new Error(t("notFound"))}
          feature={tList("errorFeature")}
          onRetry={() => business.refetch()}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold">{b.name}</h1>
                <BusinessStatusBadge status={b.status} />
              </div>
              <a
                href={`/b/${b.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground"
              >
                /b/{b.slug} <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">{t("publicPage")}</span>
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {b.status === "PENDING_APPROVAL" && (
                <Button variant="outline" className="text-destructive" onClick={() => open("reject")}>
                  {t("reject")}
                </Button>
              )}
              {(b.status === "PENDING_APPROVAL" || b.status === "REJECTED") && (
                <Button onClick={() => open("approve")}>{t("approve")}</Button>
              )}
              {b.status === "ACTIVE" && (
                <Button variant="outline" className="text-destructive" onClick={() => open("suspend")}>
                  {t("suspend")}
                </Button>
              )}
              {b.status === "SUSPENDED" && <Button onClick={() => open("reactivate")}>{t("reactivate")}</Button>}
            </div>
          </div>

          {b.status !== "ACTIVE" && (
            <div
              role="status"
              className={cn(
                "flex gap-3 rounded-md border-l-4 px-4 py-3",
                b.status === "PENDING_APPROVAL" ? "border-warning bg-warning-muted" : "border-destructive bg-destructive/8"
              )}
            >
              {b.status === "PENDING_APPROVAL" ? (
                <Hourglass className="mt-0.5 size-5 shrink-0 text-warning-foreground" aria-hidden />
              ) : (
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="font-semibold">
                  {t(`statusSince.${b.status}`, {
                    date: f.date(b.statusChangedAt ?? b.createdAt, "d MMM yyyy, HH:mm"),
                  })}
                </p>
                {b.statusReason && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{t("internalReason")}:</span> {b.statusReason}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Section title={t("profile")}>
              <dl className="grid grid-cols-2 gap-4">
                <Fact label={t("contact")}>
                  {b.email || b.phone ? (
                    <span className="flex flex-col gap-1">
                      {b.email && (
                        <span className="inline-flex items-center gap-1.5 break-all">
                          <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden /> {b.email}
                        </span>
                      )}
                      {b.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden /> {b.phone}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t("noContact")}</span>
                  )}
                </Fact>
                <Fact label={t("created")}>{f.date(b.createdAt, "d MMM yyyy")}</Fact>
                <Fact label={t("timezone")}>{b.timezone}</Fact>
                <Fact label={t("language")}>{b.locale.toUpperCase()}</Fact>
              </dl>
            </Section>

            <Section title={t("owner")}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-all text-sm font-medium">{b.ownerEmail}</span>
                  <AccountStatusBadge active={b.ownerActive} />
                </div>
                {!b.ownerEmailVerified && (
                  <p className="text-xs text-muted-foreground">{tStatus("unverified")}</p>
                )}
                <div>
                  {b.ownerActive ? (
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => open("disableOwner")}>
                      {tu("disable")}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => open("enableOwner")}>
                      {tu("enable")}
                    </Button>
                  )}
                </div>
              </div>
            </Section>
          </div>

          <Usage business={b} />

          <section>
            <h2 className="mb-3 text-base font-semibold">{t("history")}</h2>
            <AuditList targetId={b.id} limit={20} />
          </section>

          <ConfirmDialog
            open={dialog === "approve"}
            onOpenChange={(o) => !o && setDialog(null)}
            title={t("approveTitle", { name: b.name })}
            description={dialogError ?? t("approveDescription")}
            confirmLabel={t("approve")}
            loading={approve.isPending}
            onConfirm={() => run(() => approve.mutateAsync(b.id), t("approved"))}
          />
          <ReasonDialog
            open={dialog === "reject"}
            onOpenChange={(o) => !o && setDialog(null)}
            title={t("rejectTitle", { name: b.name })}
            description={t("rejectDescription")}
            confirmLabel={t("reject")}
            loading={reject.isPending}
            error={dialogError}
            onConfirm={(reason) => run(() => reject.mutateAsync({ id: b.id, reason }), t("rejected"))}
          />
          <ReasonDialog
            open={dialog === "suspend"}
            onOpenChange={(o) => !o && setDialog(null)}
            title={t("suspendTitle", { name: b.name })}
            description={t("suspendDescription")}
            confirmLabel={t("suspend")}
            loading={suspend.isPending}
            error={dialogError}
            onConfirm={(reason) => run(() => suspend.mutateAsync({ id: b.id, reason }), t("suspended"))}
          />
          <ConfirmDialog
            open={dialog === "reactivate"}
            onOpenChange={(o) => !o && setDialog(null)}
            title={t("reactivateTitle", { name: b.name })}
            description={dialogError ?? t("reactivateDescription")}
            confirmLabel={t("reactivate")}
            loading={reactivate.isPending}
            onConfirm={() => run(() => reactivate.mutateAsync(b.id), t("reactivated"))}
          />
          <ReasonDialog
            open={dialog === "disableOwner"}
            onOpenChange={(o) => !o && setDialog(null)}
            title={tu("disableTitle", { email: b.ownerEmail })}
            description={tu("disableDescription")}
            confirmLabel={tu("disable")}
            loading={disableOwner.isPending}
            error={dialogError}
            onConfirm={(reason) => run(() => disableOwner.mutateAsync({ id: b.ownerId, reason }), tu("disabled"))}
          />
          <ConfirmDialog
            open={dialog === "enableOwner"}
            onOpenChange={(o) => !o && setDialog(null)}
            title={tu("enableTitle", { email: b.ownerEmail })}
            description={dialogError ?? tu("enableDescription")}
            confirmLabel={tu("enable")}
            loading={enableOwner.isPending}
            onConfirm={() => run(() => enableOwner.mutateAsync(b.ownerId), tu("enabled"))}
          />
        </div>
      )}
    </PageContainer>
  );
}
