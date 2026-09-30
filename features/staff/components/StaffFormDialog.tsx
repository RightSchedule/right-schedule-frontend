"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Input } from "@/components/ui/input";
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
import { useCreateStaff, useUpdateStaff } from "@/features/staff/hooks/useStaff";
import type { Staff } from "@/types/domain";

type StaffErrorTranslator = ReturnType<typeof useTranslations<"staff.form.errors">>;

export function createStaffSchema(t: StaffErrorTranslator) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(255),
    email: z.union([z.literal(""), z.email(t("emailInvalid"))]),
    phone: z.string().max(50).optional(),
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
  const tc = useTranslations("common.actions");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open && (
          <StaffForm
            submitLabel={t("submit")}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
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
