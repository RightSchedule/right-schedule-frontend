"use client";

import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared";
import type { CustomerValues } from "@/features/bookings/schemas";

export function CustomerFields({
  register,
  errors,
  idPrefix,
  nameLabel,
  contactOptional,
  emailHint,
  showNotes,
}: {
  register: UseFormRegister<CustomerValues>;
  errors: FieldErrors<CustomerValues>;
  idPrefix: string;
  nameLabel?: string;
  contactOptional?: boolean;
  emailHint?: string;
  showNotes?: boolean;
}) {
  const t = useTranslations("public.customer");
  return (
    <>
      <Field label={nameLabel ?? t("fullName")} htmlFor={`${idPrefix}-name`} error={errors.name?.message}>
        <Input
          id={`${idPrefix}-name`}
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
      </Field>
      <Field label={contactOptional ? t("phoneOptional") : t("phone")} htmlFor={`${idPrefix}-phone`} error={errors.phone?.message}>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
      </Field>
      <Field
        label={contactOptional ? t("emailOptional") : t("email")}
        htmlFor={`${idPrefix}-email`}
        error={errors.email?.message}
        hint={emailHint}
      >
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>
      {showNotes && (
        <Field label={t("notesOptional")} htmlFor={`${idPrefix}-notes`} error={errors.notes?.message}>
          <Textarea id={`${idPrefix}-notes`} rows={3} {...register("notes")} />
        </Field>
      )}
    </>
  );
}
