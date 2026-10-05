"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Field, FormError } from "@/components/shared";
import { FormActions, FormDialog } from "@/components/shared/FormDialog";
import { useErrorMessage } from "@/lib/i18n/errors";
import { LIMITS, optionalText, requiredName } from "@/lib/validation";
import { useCreateService, useUpdateService } from "@/features/services/hooks/useServices";
import type { Service } from "@/types/domain";

type ServiceErrorTranslator = ReturnType<typeof useTranslations<"services.form.errors">>;

export function createServiceSchema(t: ServiceErrorTranslator) {
  return z.object({
    name: requiredName(t("nameRequired")),
    description: optionalText(LIMITS.description),
    durationMinutes: z
      .number({ error: t("durationRequired") })
      .int(t("durationInteger"))
      .min(5, t("durationMin"))
      .max(720, t("durationMax")),
    price: z.number({ error: t("priceRequired") }).min(0, t("priceMin")),
    maxPartySize: z
      .number({ error: t("partySizeInvalid") })
      .int(t("partySizeInvalid"))
      .min(1, t("partySizeInvalid"))
      .max(LIMITS.partySize, t("partySizeInvalid"))
      .nullable(),
  });
}

export type ServiceFormValues = z.infer<ReturnType<typeof createServiceSchema>>;

const DEFAULTS: ServiceFormValues = { name: "", description: "", durationMinutes: 30,
  price: 0,
  maxPartySize: null,
};

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
          maxPartySize: service.maxPartySize ?? null,
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
      <Field
        label={t("maxPartySize")}
        htmlFor="service-party"
        hint={t("maxPartySizeHint")}
        error={errors.maxPartySize?.message}
      >
        <Input
          id="service-party"
          type="number"
          inputMode="numeric"
          min={1}
          max={LIMITS.partySize}
          aria-invalid={!!errors.maxPartySize}
          {...register("maxPartySize", {
            setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
          })}
        />
      </Field>
      <FormError message={error} />
      <FormActions submitLabel={submitLabel} loading={isSubmitting} onCancel={onCancel} />
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={service ? t("editTitle") : t("newTitle")}
      description={t("description")}
    >
      <ServiceForm
        key={service?.id ?? "new"}
        service={service}
        submitLabel={service ? tc("saveChanges") : t("submitNew")}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}
