"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { useRateLimit } from "@/features/auth/hooks/useRateLimit";
import { authApi } from "@/lib/api/auth";
import { useErrorMessage } from "@/lib/i18n/errors";
import { LIMITS, newPassword, requiredEmail } from "@/lib/validation";

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("auth.recovery");
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
      {description && <p className="mb-8 mt-2 text-muted-foreground">{description}</p>}
      {children}
      <p className="mt-6 text-sm">
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("backToSignIn")}
        </Link>
      </p>
    </main>
  );
}

export function ResendVerification() {
  const t = useTranslations("auth");
  const tr = useTranslations("auth.recovery.resend");
  const errorMessage = useErrorMessage();
  const rateLimit = useRateLimit();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(
    () => z.object({ email: requiredEmail(t("validation.invalidEmail")) }),
    [t]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: z.infer<typeof schema>) {
    setError(null);
    try {
      await authApi.resendVerification(email);
      setSent(true);
    } catch (e) {
      if (rateLimit.handle(e)) return;
      setError(errorMessage(e));
    }
  }

  return (
    <Shell title={tr("title")} description={sent ? undefined : tr("description")}>
      {sent ? (
        <p role="status" className="mt-4 text-sm">
          {tr("sent")}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Field label={t("fields.email")} htmlFor="resend-email" error={errors.email?.message}>
            <Input
              id="resend-email"
              type="email"
              autoComplete="email"
              placeholder={t("fields.emailPlaceholder")}
              {...register("email")}
            />
          </Field>
          <FormError message={rateLimit.message ?? error} />
          <LoadingButton type="submit" size="lg" loading={isSubmitting} disabled={rateLimit.limited}>
            {tr("submit")}
          </LoadingButton>
        </form>
      )}
    </Shell>
  );
}

export function ForgotPassword() {
  const t = useTranslations("auth");
  const tr = useTranslations("auth.recovery.forgot");
  const errorMessage = useErrorMessage();
  const rateLimit = useRateLimit();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(
    () => z.object({ email: requiredEmail(t("validation.invalidEmail")) }),
    [t]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: z.infer<typeof schema>) {
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (e) {
      if (rateLimit.handle(e)) return;
      setError(errorMessage(e));
    }
  }

  return (
    <Shell title={tr("title")} description={sent ? undefined : tr("description")}>
      {sent ? (
        <p role="status" className="mt-4 text-sm">
          {tr("sent")}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Field label={t("fields.email")} htmlFor="forgot-email" error={errors.email?.message}>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder={t("fields.emailPlaceholder")}
              {...register("email")}
            />
          </Field>
          <FormError message={rateLimit.message ?? error} />
          <LoadingButton type="submit" size="lg" loading={isSubmitting} disabled={rateLimit.limited}>
            {tr("submit")}
          </LoadingButton>
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword({ token }: { token: string }) {
  const t = useTranslations("auth");
  const tr = useTranslations("auth.recovery.reset");
  const errorMessage = useErrorMessage();
  const rateLimit = useRateLimit();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        password: newPassword({
          min: t("validation.passwordMin"),
          max: t("validation.passwordMax"),
        }),
      }),
    [t]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit({ password }: z.infer<typeof schema>) {
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (e) {
      if (rateLimit.handle(e)) return;
      setError(errorMessage(e, { fallback: tr("failure") }));
    }
  }

  return (
    <Shell title={tr("title")} description={done ? undefined : tr("description")}>
      {done ? (
        <p role="status" className="mt-4 text-sm">
          {tr("success")}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Field label={tr("newPassword")} htmlFor="reset-password" error={errors.password?.message}>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              maxLength={LIMITS.passwordMax}
              placeholder={t("fields.newPasswordPlaceholder")}
              {...register("password")}
            />
          </Field>
          <FormError message={rateLimit.message ?? error} />
          <LoadingButton type="submit" size="lg" loading={isSubmitting} disabled={rateLimit.limited}>
            {tr("submit")}
          </LoadingButton>
        </form>
      )}
    </Shell>
  );
}
