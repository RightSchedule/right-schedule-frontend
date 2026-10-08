"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ErrorState, PaginationNav, SkeletonList } from "@/components/shared";
import { useAuditLog } from "@/features/admin/hooks/useAdmin";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { AuditEntry } from "@/types/domain";

function targetHref(entry: AuditEntry): string | null {
  if (entry.targetLabel === null) return null;
  return entry.targetType === "BUSINESS"
    ? `/admin/businesses/${entry.targetId}`
    : `/admin/users?q=${encodeURIComponent(entry.targetLabel)}`;
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const t = useTranslations("admin.audit");
  const f = useLocaleFormat();
  const href = targetHref(entry);
  const target = entry.targetLabel ?? t("deletedTarget");

  return (
    <li className="flex flex-col gap-0.5 px-4 py-3">
      <p className="text-sm">
        <span className="font-medium">{entry.actorEmail ?? t("deletedActor")}</span>{" "}
        <span className="text-muted-foreground">{t(`actions.${entry.action}`)}</span>{" "}
        {href ? (
          <Link href={href} className="font-medium text-primary hover:underline">
            {target}
          </Link>
        ) : (
          <span className="font-medium">{target}</span>
        )}
      </p>
      {entry.reason && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{t("reason", { reason: entry.reason })}</p>
      )}
      <time dateTime={entry.createdAt} className="text-xs text-muted-foreground">
        {f.date(entry.createdAt, "d MMM yyyy, HH:mm")}
      </time>
    </li>
  );
}

/** Audit entries newest first; `targetId` narrows it to one business or account, `limit` hides paging. */
export function AuditList({
  targetId = null,
  page = 0,
  onPageChange,
  limit,
}: {
  targetId?: string | null;
  page?: number;
  onPageChange?: (page: number) => void;
  limit?: number;
}) {
  const t = useTranslations("admin.audit");
  const tp = useTranslations("admin.pagination");
  const { data, isLoading, error, refetch, isPlaceholderData } = useAuditLog(targetId, page);

  if (isLoading) return <SkeletonList count={3} className="h-14" />;
  if (error) return <ErrorState error={error} feature={t("errorFeature")} onRetry={() => refetch()} />;

  const entries = (data?.content ?? []).slice(0, limit);
  const totalPages = data?.totalPages ?? 0;
  if (entries.length === 0) return <p className="py-6 text-sm text-muted-foreground">{t("empty")}</p>;

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {entries.map((entry) => (
          <AuditRow key={entry.id} entry={entry} />
        ))}
      </ul>
      {onPageChange && !limit && (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          disabled={isPlaceholderData}
          onPageChange={onPageChange}
          label={tp("label")}
          previousLabel={tp("previous")}
          nextLabel={tp("next")}
          pageLabel={tp("page", { page: page + 1, total: totalPages })}
        />
      )}
    </div>
  );
}
