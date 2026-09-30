"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
  initials,
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
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-3xl" />
          ))}
        </div>
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
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          {staff.map((member) => (
            <li key={member.id}>
              <Link
                href={`/staff/${member.id}`}
                className="flex items-center gap-3.5 p-4 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
              >
                <Avatar className="size-11">
                  {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.95rem] font-semibold">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email || member.phone || t("noContact")}
                  </p>
                </div>
                {!member.active && <Badge variant="secondary">{t("inactive")}</Badge>}
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <StaffFormDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(created) => router.push(`/staff/${created.id}`)}
      />
    </PageContainer>
  );
}
