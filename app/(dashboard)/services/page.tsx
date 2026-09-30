"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
} from "@/components/shared";
import { ServiceFormDialog } from "@/features/services/components/ServiceFormDialog";
import {
  useDeleteService,
  useServices,
  useToggleService,
} from "@/features/services/hooks/useServices";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { Service } from "@/types/domain";

export default function ServicesPage() {
  const t = useTranslations("services.page");
  const tc = useTranslations("common.actions");
  const errorMessage = useErrorMessage();
  const { price } = useLocaleFormat();
  const toast = useToast();
  const { data: services, isLoading, error, refetch } = useServices();
  const toggle = useToggleService();
  const remove = useDeleteService();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setFormOpen(true);
  }

  async function onToggle(service: Service) {
    try {
      await toggle.mutateAsync(service.id);
      toast.success(
        service.active
          ? t("hiddenToast", { name: service.name })
          : t("bookableToast", { name: service.name })
      );
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function onDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(t("deleted"));
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus /> {t("newButton")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !services || services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button size="lg" onClick={openCreate}>
              <Plus /> {t("addButton")}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <li key={service.id}>
              <Card className={service.active ? "" : "opacity-70"}>
                <CardContent className="flex flex-col gap-4 p-5 pt-5">
                  <div className="flex items-start gap-3.5">
                    <span
                      aria-hidden
                      className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"
                    >
                      <Scissors className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold leading-tight">{service.name}</h2>
                      {service.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={service.active ? "success" : "secondary"} className="shrink-0 gap-1.5">
                      <span aria-hidden className="size-1.5 rounded-full bg-current" />
                      {service.active ? t("active") : t("hidden")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-sm text-muted-foreground">
                      <Clock className="size-3.5 text-primary" aria-hidden />
                      {t("minutes", { count: service.durationMinutes })}
                    </span>
                    <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-bold text-foreground">
                      {price(service.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <label className="flex items-center gap-2.5 text-sm">
                      <Switch
                        checked={service.active}
                        onCheckedChange={() => onToggle(service)}
                        disabled={toggle.isPending}
                        aria-label={t("toggleAria", { name: service.name })}
                      />
                      <span className="text-muted-foreground">{t("bookable")}</span>
                    </label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(service)}
                        aria-label={t("editAria", { name: service.name })}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(service)}
                        aria-label={t("deleteAria", { name: service.name })}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? t("deleteTitle", { name: deleting.name }) : t("deleteTitleFallback")}
        description={t("deleteDescription")}
        confirmLabel={tc("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={onDelete}
      />
    </PageContainer>
  );
}
