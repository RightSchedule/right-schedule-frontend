"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  ErrorState,
  Field,
  FormError,
  LoadingButton,
  PageContainer,
  PageHeader,
} from "@/components/shared";
import { PrivacyCard } from "@/features/account/components/PrivacyCard";
import { BookingLinkCard } from "@/features/business/components/BookingLinkCard";
import { useBusiness, useUpdateBusiness } from "@/features/business/hooks/useBusiness";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { useErrorMessage } from "@/lib/i18n/errors";
import { timezones } from "@/lib/utils/booking-link";
import { LIMITS, optionalEmail, optionalText, requiredName } from "@/lib/validation";

type Translator = ReturnType<typeof useTranslations<"settings">>;

function makeSchema(t: Translator) {
  return z.object({
    name: requiredName(t("validation.nameRequired")),
    email: optionalEmail(t("validation.emailInvalid")),
    phone: optionalText(LIMITS.phone),
    address: optionalText(LIMITS.address),
    timezone: z.string().min(1),
    locale: z.enum(locales),
    defaultMaxPartySize: z
      .number({ error: t("validation.partySizeInvalid") })
      .int(t("validation.partySizeInvalid"))
      .min(1, t("validation.partySizeInvalid"))
      .max(LIMITS.partySize, t("validation.partySizeInvalid")),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tLanguage = useTranslations("common.language");
  const tActions = useTranslations("common.actions");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const { data: business, isLoading, error, refetch } = useBusiness();
  const update = useUpdateBusiness();
  const [formError, setFormError] = useState<string | null>(null);
  const [zones] = useState(timezones);
  const schema = useMemo(() => makeSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (business) {
      reset({
        name: business.name,
        email: business.email ?? "",
        phone: business.phone ?? "",
        address: business.address ?? "",
        timezone: business.timezone,
        locale: isLocale(business.locale) ? business.locale : defaultLocale,
        defaultMaxPartySize: business.defaultMaxPartySize ?? 1,
      });
    }
  }, [business, reset]);

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await update.mutateAsync({
        name: values.name,
        email: values.email || undefined,
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
        timezone: values.timezone,
        logoUrl: business?.logoUrl,
        locale: values.locale,
        defaultMaxPartySize: values.defaultMaxPartySize,
      });
      toast.success(t("saved"));
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <PageContainer>
      <PageHeader title={t("header.title")} description={t("header.description")} />

      {isLoading ? (
        <Skeleton className="h-96 max-w-2xl rounded-lg" />
      ) : error || !business ? (
        <ErrorState error={error ?? new Error(t("notFound"))} onRetry={() => refetch()} />
      ) : (
        <div className="flex max-w-2xl flex-col gap-8">
          <BookingLinkCard slug={business.slug} />

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4 border-t border-border pt-6"
          >
            <h2 className="text-xl font-semibold">{t("profile.title")}</h2>
            <Field label={t("profile.name")} htmlFor="biz-name" error={errors.name?.message}>
              <Input id="biz-name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("profile.email")} htmlFor="biz-email" error={errors.email?.message}>
                <Input
                  id="biz-email"
                  type="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </Field>
              <Field label={t("profile.phone")} htmlFor="biz-phone">
                <Input id="biz-phone" type="tel" {...register("phone")} />
              </Field>
            </div>
            <Field label={t("profile.address")} htmlFor="biz-address">
              <Input id="biz-address" autoComplete="street-address" {...register("address")} />
            </Field>
            <Field
              label={t("profile.timezone")}
              htmlFor="biz-timezone"
              hint={t("profile.timezoneHint")}
            >
              <Select id="biz-timezone" {...register("timezone")}>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={t("profile.emailLanguage")}
              htmlFor="biz-locale"
              hint={t("profile.emailLanguageHint")}
            >
              <Select id="biz-locale" {...register("locale")}>
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {tLanguage(l)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={t("profile.defaultMaxPartySize")}
              htmlFor="biz-party"
              hint={t("profile.defaultMaxPartySizeHint")}
              error={errors.defaultMaxPartySize?.message}
            >
              <Input
                id="biz-party"
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITS.partySize}
                aria-invalid={!!errors.defaultMaxPartySize}
                {...register("defaultMaxPartySize", { valueAsNumber: true })}
              />
            </Field>
            <FormError message={formError} />
            <div className="flex justify-end">
              <LoadingButton type="submit" loading={update.isPending} disabled={!isDirty}>
                {tActions("saveChanges")}
              </LoadingButton>
            </div>
          </form>

          <PrivacyCard />
        </div>
      )}
    </PageContainer>
  );
}
