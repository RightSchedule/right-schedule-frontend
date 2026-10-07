"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { useJoinWaitlist } from "@/features/waitlist/hooks/useWaitlist";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import { dateFromISO } from "@/lib/utils/date";
import { optionalPhone, requiredEmail, requiredName } from "@/lib/validation";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalTime = z.union([z.literal(""), z.string().regex(TIME)]);

export function WaitlistDialog({
  open,
  onOpenChange,
  businessId,
  serviceId,
  staffId,
  date,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  serviceId: string;
  staffId: string | null;
  date: string;
}) {
  const t = useTranslations("public.waitlist");
  const tCustomer = useTranslations("public.customer");
  const tValidation = useTranslations("public.validation");
  const f = useLocaleFormat();
  const errorMessage = useErrorMessage();
  const join = useJoinWaitlist();
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          name: requiredName(tValidation("nameRequired"), 2),
          email: requiredEmail(tValidation("emailInvalid")),
          phone: optionalPhone(tValidation("phoneInvalid")),
          fromTime: optionalTime,
          toTime: optionalTime,
        })
        .refine((v) => !v.fromTime || !v.toTime || v.toTime > v.fromTime, {
          path: ["toTime"],
          message: t("timeOrder"),
        }),
    [t, tValidation]
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", fromTime: "", toTime: "" },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setError(null);
      setJoined(false);
    }
    onOpenChange(next);
  }

  async function onSubmit(v: Values) {
    setError(null);
    try {
      await join.mutateAsync({
        businessId,
        serviceId,
        staffId,
        desiredDate: date,
        fromTime: v.fromTime || undefined,
        toTime: v.toTime || undefined,
        name: v.name,
        email: v.email,
        phone: v.phone || undefined,
      });
      setJoined(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        {joined ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CircleCheck className="size-8 text-success-foreground" aria-hidden />
            <DialogTitle>{t("success")}</DialogTitle>
            <DialogDescription>{t("successDescription")}</DialogDescription>
            <Button className="mt-2" onClick={() => handleOpenChange(false)}>
              {t("close")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description", { date: f.date(dateFromISO(date), "EEEE d MMMM") })}</DialogDescription>
            </DialogHeader>
            <Field label={tCustomer("fullName")} htmlFor="wl-name" error={errors.name?.message}>
              <Input id="wl-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field label={tCustomer("email")} htmlFor="wl-email" error={errors.email?.message}>
              <Input id="wl-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field label={t("phone")} htmlFor="wl-phone" error={errors.phone?.message}>
              <Input id="wl-phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("from")} htmlFor="wl-from" error={errors.fromTime?.message}>
                <Input id="wl-from" type="time" {...register("fromTime")} />
              </Field>
              <Field label={t("to")} htmlFor="wl-to" error={errors.toTime?.message}>
                <Input id="wl-to" type="time" {...register("toTime")} />
              </Field>
            </div>
            <FormError message={error} />
            <LoadingButton type="submit" size="lg" loading={isSubmitting}>
              {t("submit")}
            </LoadingButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
