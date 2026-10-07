"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Field, FormError } from "@/components/shared";
import { FormActions, FormDialog } from "@/components/shared/FormDialog";
import { useErrorMessage } from "@/lib/i18n/errors";
import { LIMITS, optionalEmail, optionalText, requiredName } from "@/lib/validation";
import { useCreateStaff, useUpdateStaff } from "@/features/staff/hooks/useStaff";
import type { Staff } from "@/types/domain";

type StaffErrorTranslator = ReturnType<typeof useTranslations<"staff.form.errors">>;

export function createStaffSchema(t: StaffErrorTranslator) {
  return z.object({
    name: requiredName(t("nameRequired")),
    email: optionalEmail(t("emailInvalid")),
    phone: optionalText(LIMITS.phone),
  });
}

export type StaffFormValues = z.infer<ReturnType<typeof createStaffSchema>>;

const DEFAULTS: StaffFormValues = { name: "", email: "", phone: "" };

export function StaffForm({
  staff,
  submitLabel,
  onSubmit,
  onCancel,
  children,
}: {
  staff?: Staff | null;
  submitLabel: string;
  onSubmit: (values: { name: string; email?: string; phone?: string }) => Promise<void>;
  onCancel?: () => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("staff.form");
  const tErrors = useTranslations("staff.form.errors");
  const errorMessage = useErrorMessage();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => createStaffSchema(tErrors), [tErrors]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: staff
      ? { name: staff.name, email: staff.email ?? "", phone: staff.phone ?? "" }
      : DEFAULTS,
  });

  async function submit(values: StaffFormValues) {
    setError(null);
    try {
      await onSubmit({
        name: values.name,
        email: values.email || undefined,
        phone: values.phone?.trim() || undefined,
      });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <Field label={t("name")} htmlFor="staff-name" error={errors.name?.message}>
        <Input
          id="staff-name"
          placeholder={t("namePlaceholder")}
          autoComplete="off"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("email")} htmlFor="staff-email" error={errors.email?.message}>
          <Input
            id="staff-email"
            type="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field label={t("phone")} htmlFor="staff-phone" error={errors.phone?.message}>
          <Input
            id="staff-phone"
            type="tel"
            placeholder={t("phonePlaceholder")}
            {...register("phone")}
          />
        </Field>
      </div>
      {children}
      <FormError message={error} />
      <FormActions submitLabel={submitLabel} loading={isSubmitting} onCancel={onCancel} />
    </form>
  );
}

export function StaffFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (staff: Staff) => void;
}) {
  const t = useTranslations("staff.dialog");
  const toast = useToast();
  const create = useCreateStaff();

  async function onSubmit(values: { name: string; email?: string; phone?: string }) {
    const created = await create.mutateAsync(values);
    toast.success(t("added", { name: created.name }));
    onOpenChange(false);
    onCreated?.(created);
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("description")}
    >
      <StaffForm
        submitLabel={t("submit")}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}

export function StaffProfileForm({ staff }: { staff: Staff }) {
  const t = useTranslations("staff.dialog");
  const toast = useToast();
  const update = useUpdateStaff();

  async function onSubmit(values: { name: string; email?: string; phone?: string }) {
    await update.mutateAsync({ id: staff.id, photoUrl: staff.photoUrl, ...values });
    toast.success(t("profileSaved"));
  }

  return (
    <StaffForm
      key={staff.id}
      staff={staff}
      submitLabel={t("saveProfile")}
      onSubmit={onSubmit}
    />
  );
}
