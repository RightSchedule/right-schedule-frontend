"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Scissors } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, LoadingButton } from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import { useServices } from "@/features/services/hooks/useServices";
import { useSetStaffServices, useStaffServices } from "@/features/staff/hooks/useStaff";

export function StaffServicesPanel({ staffId }: { staffId: string }) {
  const t = useTranslations("staff.servicesPanel");
  const errorMessage = useErrorMessage();
  const { price } = useLocaleFormat();
  const toast = useToast();
  const services = useServices();
  const assigned = useStaffServices(staffId);
  const save = useSetStaffServices();
  const [edited, setEdited] = useState<Set<string> | null>(null);
  const selected = edited ?? (assigned.data ? new Set(assigned.data) : null);

  if (services.isLoading || assigned.isLoading || !selected) {
    if (services.error || assigned.error) {
      return (
        <ErrorState
          error={services.error ?? assigned.error}
          onRetry={() => {
            services.refetch();
            assigned.refetch();
          }}
        />
      );
    }
    return <Skeleton className="h-48 rounded-lg" />;
  }

  const list = services.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Scissors}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
      />
    );
  }

  const dirty =
    assigned.data !== undefined &&
    (assigned.data.length !== selected.size || assigned.data.some((id) => !selected.has(id)));

  function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setEdited(next);
  }

  async function onSave() {
    try {
      await save.mutateAsync({ id: staffId, serviceIds: [...selected!] });
      toast.success(t("saved"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {list.map((service) => (
          <li key={service.id}>
            <label className="flex cursor-pointer items-center gap-3.5 p-4">
              <Checkbox
                checked={selected.has(service.id)}
                onCheckedChange={(c) => toggle(service.id, c === true)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium">{service.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {t("summary", {
                    minutes: service.durationMinutes,
                    price: price(service.price),
                  })}
                </span>
              </span>
              {!service.active && <Badge variant="secondary">{t("hidden")}</Badge>}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-muted-foreground">{t("unsaved")}</span>}
        <LoadingButton size="lg" onClick={onSave} loading={save.isPending} disabled={!dirty}>
          {t("save")}
        </LoadingButton>
      </div>
    </div>
  );
}
