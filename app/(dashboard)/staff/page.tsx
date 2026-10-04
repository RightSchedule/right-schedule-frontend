"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  EntityListRow,
  ErrorState,
  ListContainer,
  PageContainer,
  PageHeader,
  SkeletonList,
} from "@/components/shared";
import { StaffFormDialog } from "@/features/staff/components/StaffFormDialog";
import { useStaff } from "@/features/staff/hooks/useStaff";

export default function StaffPage() {
  const t = useTranslations("staff.list");
  const router = useRouter();
  const { data: staff, isLoading, error, refetch } = useStaff();
  const [open, setOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> {t("addButton")}
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !staff || staff.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus /> {t("addButton")}
            </Button>
          }
        />
      ) : (
        <ListContainer>
          {staff.map((member) => (
            <EntityListRow
              key={member.id}
              name={member.name}
              photoUrl={member.photoUrl}
              href={`/staff/${member.id}`}
              trailing={!member.active && <Badge variant="secondary">{t("inactive")}</Badge>}
            >
              <p className="truncate text-base font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {member.email || member.phone || t("noContact")}
              </p>
            </EntityListRow>
          ))}
        </ListContainer>
      )}

      <StaffFormDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(created) => router.push(`/staff/${created.id}`)}
      />
    </PageContainer>
  );
}
