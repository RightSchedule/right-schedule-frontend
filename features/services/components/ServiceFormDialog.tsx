"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useCreateService, useUpdateService } from "@/features/services/hooks/useServices";
import type { Service } from "@/types/domain";

type ServiceErrorTranslator = ReturnType<typeof useTranslations<"services.form.errors">>;

export function createServiceSchema(t: ServiceErrorTranslator) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(255),
    description: z.string().max(1000).optional(),
    durationMinutes: z
      .number({ error: t("durationRequired") })
      .int(t("durationInteger"))
      .min(5, t("durationMin"))
      .max(720, t("durationMax")),
    price: z.number({ error: t("priceRequired") }).min(0, t("priceMin")),
  });
}

export type ServiceFormValues = z.infer<ReturnType<typeof createServiceSchema>>;

const DEFAULTS: ServiceFormValues = { name: "", description: "", durationMinutes: 30, price: 0 };

/** Inline service form, reused by the dialog and the onboarding wizard. */
export function ServiceForm({
  service,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  service?: Service | null;
  submitLabel: string;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const t = useTranslations("services.form");
  const tErrors = useTranslations("services.form.errors");
  const tc = useTranslations("common.actions");
  const errorMessage = useErrorMessage();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => createServiceSchema(tErrors), [tErrors]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description ?? "",
          durationMinutes: service.durationMinutes,
          price: service.price,
        }
      : DEFAULTS,
  });

  async function submit(values: ServiceFormValues) {
    setError(null);
    try {
      await onSubmit({ ...values, description: values.description?.trim() || undefined });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <Field label={t("name")} htmlFor="service-name" error={errors.name?.message}>
        <Input
          id="service-name"
          placeholder={t("namePlaceholder")}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
      </Field>
      <Field label={t("description")} htmlFor="service-description">
        <Textarea
          id="service-description"
          rows={2}
          placeholder={t("descriptionPlaceholder")}
          {...register("description")}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t("duration")}
          htmlFor="service-duration"
          error={errors.durationMinutes?.message}
        >
          <Input
            id="service-duration"
            type="number"
            inputMode="numeric"
            step={5}
            aria-invalid={!!errors.durationMinutes}
            {...register("durationMinutes", { valueAsNumber: true })}
          />
        </Field>
        <Field label={t("price")} htmlFor="service-price" error={errors.price?.message}>
          <Input
            id="service-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            aria-invalid={!!errors.price}
            {...register("price", { valueAsNumber: true })}
          />
        </Field>
      </div>
      <FormError message={error} />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tc("cancel")}
          </Button>
        )}
        <LoadingButton type="submit" loading={isSubmitting}>
          {submitLabel}
        </LoadingButton>
      </div>
    </form>
  );
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}) {
  const t = useTranslations("services.dialog");
  const tc = useTranslations("common.actions");
  const toast = useToast();
  const create = useCreateService();
  const update = useUpdateService();

  async function onSubmit(values: ServiceFormValues) {
    if (service) {
      await update.mutateAsync({ id: service.id, ...values });
      toast.success(t("updated"));
    } else {
      await create.mutateAsync(values);
      toast.success(t("created"));
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open && (
          <ServiceForm
            key={service?.id ?? "new"}
            service={service}
            submitLabel={service ? tc("saveChanges") : t("submitNew")}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
