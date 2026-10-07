"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useToast } from "@/components/ui/toast";
import { FormError } from "@/components/shared";
import { FormActions, FormDialog } from "@/components/shared/FormDialog";
import { CustomerFields } from "@/features/bookings/components/CustomerFields";
import type { CustomerValues } from "@/features/bookings/schemas";
import { useCreateCustomer, useUpdateCustomer } from "@/features/customers/hooks/useCustomers";
import { useErrorMessage } from "@/lib/i18n/errors";
import {
  LIMITS,
  hasContact,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredName,
} from "@/lib/validation";
import type { Customer } from "@/types/domain";

type CustomerTranslator = ReturnType<typeof useTranslations<"customers.form.errors">>;

/** Staff-entered customer: the backend only needs one way to reach the customer. */
function createCustomerSchema(t: CustomerTranslator) {
  return z
    .object({
      name: requiredName(t("nameRequired")),
      phone: optionalPhone(t("phoneInvalid")),
      email: optionalEmail(t("emailInvalid")),
      notes: optionalText(LIMITS.notes),
    })
    .refine(hasContact, {
      path: ["phone"],
      message: t("contactRequired"),
    });
}

function CustomerForm({
  customer,
  onDone,
}: {
  customer?: Customer | null;
  onDone: () => void;
}) {
  const t = useTranslations("customers.form");
  const tErrors = useTranslations("customers.form.errors");
  const tc = useTranslations("common.actions");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => createCustomerSchema(tErrors), [tErrors]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      notes: customer?.notes ?? "",
    },
  });

  async function onSubmit(values: CustomerValues) {
    setError(null);
    const payload = {
      name: values.name,
      phone: values.phone.trim() || undefined,
      email: values.email || undefined,
      notes: values.notes?.trim() || undefined,
    };
    try {
      const saved = customer
        ? await update.mutateAsync({ id: customer.id, ...payload })
        : await create.mutateAsync(payload);
      toast.success(customer ? t("saved") : t("added", { name: saved.name }));
      onDone();
    } catch (e) {
      setError(errorMessage(e, { overrides: { 409: t("duplicate") } }));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <CustomerFields
        register={register}
        errors={errors}
        idPrefix="cf"
        nameLabel={t("name")}
        contactOptional
        showNotes
      />
      <FormError message={error} />
      <FormActions
        submitLabel={customer ? tc("saveChanges") : t("submitNew")}
        loading={isSubmitting}
        onCancel={onDone}
      />
    </form>
  );
}

export function CustomerFormDialog({
  open,
  customer,
  onOpenChange,
}: {
  open: boolean;
  customer?: Customer | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("customers.form");
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={customer ? t("editTitle") : t("newTitle")}
      description={t("description")}
      className="max-h-[90dvh] max-w-md overflow-y-auto"
    >
      <CustomerForm customer={customer} onDone={() => onOpenChange(false)} />
    </FormDialog>
  );
}
