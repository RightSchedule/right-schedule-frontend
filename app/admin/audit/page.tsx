"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, SkeletonList } from "@/components/shared";
import { AuditList } from "@/features/admin/components/AuditList";
import { pageFromParam, pageToParam, useUrlParams } from "@/lib/hooks/useUrlParams";

function AuditContent() {
  const t = useTranslations("admin.audit");
  const { params, set } = useUrlParams();
  const page = pageFromParam(params.get("page"));

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title={t("title")} description={t("description")} />
      <AuditList page={page} onPageChange={(p) => set({ page: pageToParam(p) })} />
    </PageContainer>
  );
}

export default function AdminAuditPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonList />
        </PageContainer>
      }
    >
      <AuditContent />
    </Suspense>
  );
}
