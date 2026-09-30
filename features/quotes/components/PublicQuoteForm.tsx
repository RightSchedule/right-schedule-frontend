"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { ArrowLeft, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError, LoadingButton } from "@/components/shared";
import {
  BusinessBadge,
  PublicLoading,
  PublicNotFound,
} from "@/features/bookings/components/PublicShell";
import { usePublicBusiness } from "@/features/bookings/hooks/usePublicBusiness";
import { PrivacyNoticeLink } from "@/features/legal/components/PrivacyNoticeLink";
import { useCreatePublicQuote } from "@/features/quotes/hooks/useQuotes";
import { useErrorMessage } from "@/lib/i18n/errors";

const PHONE_PATTERN = /^[+\d][\d\s()-]{5,}$/;
const MAX_DESCRIPTION = 2000;

type ErrorsTranslator = ReturnType<typeof useTranslations<"quotes.public.errors">>;

function makeSchema(t: ErrorsTranslator) {
  return z.object({
    serviceId: z.string(),
    name: z.string().trim().min(2, t("nameRequired")).max(255),
    email: z.email(t("emailInvalid")).max(255),
    phone: z.union([z.literal(""), z.string().trim().regex(PHONE_PATTERN, t("phoneInvalid")).max(50)]),
    description: z
      .string()
      .trim()
      .min(1, t("descriptionRequired"))
      .max(MAX_DESCRIPTION, t("descriptionTooLong")),
  });
}

type Values = z.infer<ReturnType<typeof makeSchema>>;

export function PublicQuoteForm({ slug, initialServiceId }: { slug: string; initialServiceId?: string }) {
  const t = useTranslations("quotes.public");
  const tErrors = useTranslations("quotes.public.errors");
  const tLegal = useTranslations("legal");
  const errorMessage = useErrorMessage();
  const { data: business, isLoading, error: loadError } = usePublicBusiness(slug);
  const create = useCreatePublicQuote();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const schema = useMemo(() => makeSchema(tErrors), [tErrors]);
  const knownService = business?.services.some((s) => s.id === initialServiceId);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      serviceId: knownService ? initialServiceId! : "",
      name: "",
      email: "",
      phone: "",
      description: "",
    },
    resetOptions: { keepDirtyValues: true },
  });
  const description = useWatch({ control, name: "description" }) ?? "";

  if (isLoading) return <PublicLoading />;
  if (loadError || !business) return <PublicNotFound />;

  async function onSubmit(values: Values) {
    setError(null);
    try {
      await create.mutateAsync({
        businessId: business!.id,
        serviceId: values.serviceId || undefined,
        name: values.name,
        email: values.email,
        phone: values.phone.trim() || undefined,
        description: values.description,
      });
      setSentTo(values.email);
    } catch (e) {
      setError(errorMessage(e, { overrides: { 404: t("errors.unavailable") } }));
    }
  }

  if (sentTo) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-success-muted text-success-foreground">
          <Check className="size-8" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("success.title")}</h1>
        <p className="mt-2 text-sm">
          {t("success.description", { business: business.name, email: sentTo })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("success.note")}</p>
        <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            className={buttonVariants({ variant: "outline" })}
            onClick={() => {
              reset();
              setSentTo(null);
            }}
          >
            {t("success.another")}
          </button>
          <Link href={`/b/${slug}`} className={buttonVariants()}>
            {t("success.back", { business: business.name })}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <BusinessBadge business={business} />
        <Link
          href={`/b/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {t("exit")}
        </Link>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-pop sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("description", { business: business.name })}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
          {business.services.length > 0 && (
            <Field label={t("service")} htmlFor="qr-service">
              <Select id="qr-service" {...register("serviceId")}>
                <option value="">{t("serviceGeneral")}</option>
                {business.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label={t("name")} htmlFor="qr-name" error={errors.name?.message}>
            <Input id="qr-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label={t("email")} htmlFor="qr-email" error={errors.email?.message} hint={t("emailHint")}>
            <Input
              id="qr-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </Field>
          <Field label={t("phone")} htmlFor="qr-phone" error={errors.phone?.message}>
            <Input
              id="qr-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
          </Field>
          <Field
            label={t("description_label")}
            htmlFor="qr-description"
            error={errors.description?.message}
            hint={tLegal("sensitiveHint")}
          >
            <Textarea
              id="qr-description"
              rows={5}
              placeholder={t("descriptionPlaceholder")}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
          </Field>
          <p
            className={
              description.length > MAX_DESCRIPTION
                ? "-mt-2 text-right text-xs text-destructive"
                : "-mt-2 text-right text-xs text-muted-foreground"
            }
          >
            {t("characters", { count: description.length })}
          </p>
          <FormError message={error} />
          <LoadingButton type="submit" size="lg" loading={create.isPending} className="w-full">
            {t("submit")}
          </LoadingButton>
          <p className="text-center text-xs text-muted-foreground">{t("footer")}</p>
          <PrivacyNoticeLink slug={slug} business={business.name} />
        </form>
      </div>
    </main>
  );
}
