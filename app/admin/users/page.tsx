"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ReasonDialog } from "@/features/admin/components/ReasonDialog";
import { AccountStatusBadge, RoleBadge } from "@/features/admin/components/StatusBadges";
import { useAdminUsers, useDisableUser, useEnableUser } from "@/features/admin/hooks/useAdmin";
import type { UserStatusFilter } from "@/lib/api/admin";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { pageFromParam, pageToParam, useUrlParams } from "@/lib/hooks/useUrlParams";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { AdminUser } from "@/types/domain";

const FILTERS = ["ALL", "ACTIVE", "DISABLED"] as const;

function UserRow({ user, onToggle }: { user: AdminUser; onToggle: (user: AdminUser) => void }) {
  const t = useTranslations("admin.users");
  const tStatus = useTranslations("admin.status");
  const f = useLocaleFormat();
  const isAdmin = user.role === "PLATFORM_ADMIN";

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-all text-base font-medium">{user.email}</p>
          <RoleBadge role={user.role} />
          <AccountStatusBadge active={user.active} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {user.businessId && user.businessName ? (
            <Link href={`/admin/businesses/${user.businessId}`} className="font-medium text-primary hover:underline">
              {user.businessName}
            </Link>
          ) : (
            t("noBusiness")
          )}
          {" · "}
          {t("joined", { date: f.date(user.createdAt, "d MMM yyyy") })}
          {!user.emailVerified && ` · ${tStatus("unverified")}`}
        </p>
      </div>
      {isAdmin ? (
        <span className="text-xs text-muted-foreground sm:max-w-40 sm:text-right">{t("protected")}</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={user.active ? "self-start text-destructive sm:self-auto" : "self-start sm:self-auto"}
          onClick={() => onToggle(user)}
        >
          {user.active ? t("disable") : t("enable")}
        </Button>
      )}
    </li>
  );
}

function UsersContent() {
  const t = useTranslations("admin.users");
  const tp = useTranslations("admin.pagination");
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const { params, set } = useUrlParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const rawStatus = params.get("status");
  const status: UserStatusFilter | null = rawStatus === "ACTIVE" || rawStatus === "DISABLED" ? rawStatus : null;
  const page = pageFromParam(params.get("page"));
  const search = useDebouncedValue(query.trim());
  const { data, isLoading, error, refetch, isPlaceholderData } = useAdminUsers(search, status, page);
  const disable = useDisableUser();
  const enable = useEnableUser();
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const filtered = !!search || status !== null;

  function toggle(user: AdminUser) {
    setDialogError(null);
    setTarget(user);
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
      setTarget(null);
    } catch (e) {
      setDialogError(errorMessage(e));
    }
  }

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <TabsList aria-label={t("filters.label")}>
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
      ) : users.length === 0 && !filtered && page === 0 ? (
        <EmptyState icon={Users} title={t("emptyTitle")} />
      ) : users.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("noMatch")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <ListContainer>
            {users.map((u) => (
              <UserRow key={u.id} user={u} onToggle={toggle} />
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

      <ReasonDialog
        open={!!target?.active}
        onOpenChange={(o) => !o && setTarget(null)}
        title={t("disableTitle", { email: target?.email ?? "" })}
        description={t("disableDescription")}
        confirmLabel={t("disable")}
        loading={disable.isPending}
        error={dialogError}
        onConfirm={(reason) => target && run(() => disable.mutateAsync({ id: target.id, reason }), t("disabled"))}
      />
      <ConfirmDialog
        open={!!target && !target.active}
        onOpenChange={(o) => !o && setTarget(null)}
        title={t("enableTitle", { email: target?.email ?? "" })}
        description={dialogError ?? t("enableDescription")}
        confirmLabel={t("enable")}
        loading={enable.isPending}
        onConfirm={() => target && run(() => enable.mutateAsync(target.id), t("enabled"))}
      />
    </PageContainer>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonList />
        </PageContainer>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
