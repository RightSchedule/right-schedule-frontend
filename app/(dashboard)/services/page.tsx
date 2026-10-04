"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListContainer,
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
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
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
        <ListContainer>
          {services.map((service) => (
            <li
              key={service.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:flex-nowrap sm:px-5"
            >
              <div className={cn("min-w-0 flex-1 basis-full sm:basis-auto", !service.active && "text-muted-foreground")}>
                <h2 className="truncate font-sans text-base font-semibold leading-tight">
                  {service.name}
                  {!service.active && (
                    <span className="ml-2 text-xs font-medium text-muted-foreground">{t("hidden")}</span>
                  )}
                </h2>
                {service.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{service.description}</p>
                )}
              </div>
              <p className="shrink-0 text-sm text-muted-foreground">
                <span className="font-mono font-medium text-foreground">{price(service.price)}</span>
                {" · "}
                {t("minutes", { count: service.durationMinutes })}
              </p>
              <Switch
                className="ml-auto sm:ml-0"
                checked={service.active}
                onCheckedChange={() => onToggle(service)}
                disabled={toggle.isPending}
                aria-label={t("toggleAria", { name: service.name })}
              />
              <div className="flex shrink-0 gap-1">
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
            </li>
          ))}
        </ListContainer>
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
