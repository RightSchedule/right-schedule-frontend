"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog, ErrorState, PageContainer, initials } from "@/components/shared";
import { StaffProfileForm } from "@/features/staff/components/StaffFormDialog";
import {
  StaffServicesPanel,
  TimeOffPanel,
  WorkingHoursPanel,
} from "@/features/staff/components/StaffPanels";
import { useDeactivateStaff, useStaffMember } from "@/features/staff/hooks/useStaff";
import { useErrorMessage } from "@/lib/i18n/errors";

export default function StaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = use(params);
  const t = useTranslations("staff.detail");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const toast = useToast();
  const { data: staff, isLoading, error, refetch } = useStaffMember(staffId);
  const deactivate = useDeactivateStaff();
  const [confirming, setConfirming] = useState(false);

  async function onDeactivate() {
    try {
      await deactivate.mutateAsync(staffId);
      toast.success(t("deactivated"));
      router.push("/staff");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <PageContainer className="max-w-3xl">
      <Link
        href="/staff"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : error || !staff ? (
        <ErrorState error={error ?? new Error(t("notFound"))} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
            <Avatar className="size-16">
              {staff.photoUrl && <AvatarImage src={staff.photoUrl} alt="" />}
              <AvatarFallback className="text-lg font-semibold">{initials(staff.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold">{staff.name}</h1>
              <div className="mt-1.5">
                <Badge variant={staff.active ? "success" : "secondary"}>
                  {staff.active ? t("active") : t("inactive")}
                </Badge>
              </div>
            </div>
            {staff.active && (
              <Button
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setConfirming(true)}
              >
                <UserX /> {t("deactivate")}
              </Button>
            )}
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="mb-5 w-full justify-start overflow-x-auto sm:w-fit">
              <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
              <TabsTrigger value="services">{t("tabs.services")}</TabsTrigger>
              <TabsTrigger value="hours">{t("tabs.hours")}</TabsTrigger>
              <TabsTrigger value="time-off">{t("tabs.timeOff")}</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <StaffProfileForm staff={staff} />
              </div>
            </TabsContent>
            <TabsContent value="services">
              <StaffServicesPanel staffId={staffId} />
            </TabsContent>
            <TabsContent value="hours">
              <WorkingHoursPanel staffId={staffId} />
            </TabsContent>
            <TabsContent value="time-off">
              <TimeOffPanel staffId={staffId} />
            </TabsContent>
          </Tabs>

          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            title={t("deactivateTitle", { name: staff.name })}
            description={t("deactivateDescription")}
            confirmLabel={t("deactivate")}
            destructive
            loading={deactivate.isPending}
            onConfirm={onDeactivate}
          />
        </>
      )}
    </PageContainer>
  );
}
