"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormError, LoadingButton } from "@/components/shared";
import { CustomerFields } from "@/features/bookings/components/CustomerFields";
import { makePublicCustomerSchema, type CustomerValues } from "@/features/bookings/schemas";

export function DetailsForm({
  onSubmit,
  error,
}: {
  onSubmit: (v: CustomerValues) => Promise<void>;
  error: string | null;
}) {
  const t = useTranslations("public.wizard.details");
  const tValidation = useTranslations("public.validation");
  const schema = useMemo(() => makePublicCustomerSchema(tValidation), [tValidation]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <CustomerFields
        register={register}
        errors={errors}
        idPrefix="cust"
        emailHint={t("emailHint")}
      />
      <FormError message={error} />
      <LoadingButton type="submit" size="lg" loading={isSubmitting} className="h-11 w-full text-base">
        {t("submit")}
      </LoadingButton>
    </form>
  );
}
