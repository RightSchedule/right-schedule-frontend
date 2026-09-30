"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormError, LoadingButton } from "@/components/shared";
import { CustomerFields } from "@/features/bookings/components/CustomerFields";
import type { CustomerValues } from "@/features/bookings/schemas";
import { useCreateCustomer, useUpdateCustomer } from "@/features/customers/hooks/useCustomers";
import { useErrorMessage } from "@/lib/i18n/errors";
import type { Customer } from "@/types/domain";

const PHONE_PATTERN = /^[+\d][\d\s()-]{5,}$/;

type CustomerTranslator = ReturnType<typeof useTranslations<"customers.form.errors">>;

/** Staff-entered customer: the backend only needs one way to reach the customer. */
function createCustomerSchema(t: CustomerTranslator) {
  return z
    .object({
      name: z.string().trim().min(1, t("nameRequired")).max(255),
      phone: z.union([
        z.literal(""),
        z.string().trim().regex(PHONE_PATTERN, t("phoneInvalid")),
      ]),
      email: z.union([z.literal(""), z.email(t("emailInvalid"))]),
      notes: z.string().max(1000).optional(),
    })
    .refine((v) => v.phone.trim() !== "" || v.email !== "", {
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
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <LoadingButton type="submit" loading={isSubmitting}>
          {customer ? tc("saveChanges") : t("submitNew")}
        </LoadingButton>
      </div>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open && (
          <CustomerForm customer={customer} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
