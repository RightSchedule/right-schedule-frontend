"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, type UseFormRegisterReturn } from "react-hook-form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CalendarDays, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRateLimit } from "@/features/auth/hooks/useRateLimit";
import { Aurora, stagger } from "@/components/ui/aurora";
import { Wordmark } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import { Field, FormError } from "@/components/shared";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useErrorMessage } from "@/lib/i18n/errors";
import { LIMITS, newPassword, requiredEmail } from "@/lib/validation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Translator = ReturnType<typeof useTranslations<"auth">>;

function makeLoginSchema(t: Translator) {
  return z.object({
    email: requiredEmail(t("validation.invalidEmail")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });
}

function makeRegisterSchema(t: Translator, termsRequired: string) {
  return makeLoginSchema(t).extend({
    password: newPassword({ min: t("validation.passwordMin"), max: t("validation.passwordMax") }),
    acceptedTerms: z.boolean().refine((v) => v, termsRequired),
  });
}

type LoginForm = z.infer<ReturnType<typeof makeLoginSchema>>;
type RegisterValues = z.infer<ReturnType<typeof makeRegisterSchema>>;

function IconInput({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 size-[1.1rem] -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  placeholder,
  autoComplete,
  maxLength,
  registration,
}: {
  id: string;
  placeholder: string;
  autoComplete: string;
  maxLength?: number;
  registration: UseFormRegisterReturn;
}) {
  const t = useTranslations("auth.fields");
  const [visible, setVisible] = useState(false);
  return (
    <IconInput icon={Lock}>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className="px-11"
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff className="size-[1.1rem]" /> : <Eye className="size-[1.1rem]" />}
      </button>
    </IconInput>
  );
}

function LoginForm() {
  const t = useTranslations("auth");
  const errorMessage = useErrorMessage();
  const { login } = useAuth();
  const rateLimit = useRateLimit();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => makeLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (e) {
      if (rateLimit.handle(e)) return;
      setError(
        errorMessage(e, {
          overrides: { 401: t("login.wrongCredentials") },
          fallback: t("login.failed"),
        })
      );
    } finally {
      resetField("password");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label={t("fields.email")} htmlFor="login-email" error={errors.email?.message}>
        <IconInput icon={Mail}>
          <Input
            id="login-email"
            type="email"
            placeholder={t("fields.emailPlaceholder")}
            autoComplete="email"
            className="pl-11"
            {...register("email")}
          />
        </IconInput>
      </Field>

      <Field label={t("fields.password")} htmlFor="login-password" error={errors.password?.message}>
        <PasswordInput
          id="login-password"
          placeholder={t("fields.passwordPlaceholder")}
          autoComplete="current-password"
          registration={register("password")}
        />
      </Field>

      <FormError message={rateLimit.message ?? error} />

      <Button
        type="submit"
        disabled={isSubmitting || rateLimit.limited}
        size="lg"
        className="mt-2 h-12 w-full text-base"
      >
        {isSubmitting ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const t = useTranslations("auth");
  const errorMessage = useErrorMessage();
  const tLegal = useTranslations("legal.register");
  const { register: registerUser } = useAuth();
  const rateLimit = useRateLimit();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => makeRegisterSchema(t, tLegal("required")), [t, tLegal]);

  const {
    register,
    control,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { acceptedTerms: false },
  });

  async function onSubmit(data: RegisterValues) {
    setError(null);
    try {
      await registerUser(data.email, data.password);
    } catch (e) {
      if (rateLimit.handle(e)) return;
      setError(errorMessage(e, { fallback: t("register.failed") }));
    } finally {
      resetField("password");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label={t("fields.email")} htmlFor="reg-email" error={errors.email?.message}>
        <IconInput icon={Mail}>
          <Input
            id="reg-email"
            type="email"
            placeholder={t("fields.emailPlaceholder")}
            autoComplete="email"
            className="pl-11"
            {...register("email")}
          />
        </IconInput>
      </Field>

      <Field label={t("fields.password")} htmlFor="reg-password" error={errors.password?.message}>
        <PasswordInput
          id="reg-password"
          placeholder={t("fields.newPasswordPlaceholder")}
          autoComplete="new-password"
          maxLength={LIMITS.passwordMax}
          registration={register("password")}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field }) => (
              <Checkbox
                id="reg-terms"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={!!errors.acceptedTerms}
                className="mt-0.5"
              />
            )}
          />
          <label htmlFor="reg-terms" className="text-xs leading-relaxed text-muted-foreground">
            {tLegal.rich("accept", {
              terms: (c) => (
                <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
                  {c}
                </Link>
              ),
              privacy: (c) => (
                <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">
                  {c}
                </Link>
              ),
              dpa: (c) => (
                <Link href="/dpa" target="_blank" className="font-medium text-primary hover:underline">
                  {c}
                </Link>
              ),
            })}
          </label>
        </div>
        {errors.acceptedTerms && (
          <p role="alert" className="text-xs text-destructive">
            {errors.acceptedTerms.message}
          </p>
        )}
      </div>

      <FormError message={rateLimit.message ?? error} />

      <Button
        type="submit"
        disabled={isSubmitting || rateLimit.limited}
        size="lg"
        className="mt-2 h-12 w-full text-base"
      >
        {isSubmitting ? t("register.submitting") : t("register.submit")}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const [tab, setTab] = useState("login");
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <Aurora className="fixed inset-0 -z-10" />
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div
            className="reveal flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-cta"
            style={stagger(0)}
          >
            <CalendarDays className="size-7" strokeWidth={2.2} />
          </div>
          <h1 className="reveal" style={stagger(1)}>
            <Wordmark className="text-4xl" />
          </h1>
          <p className="reveal text-sm text-muted-foreground" style={stagger(2)}>
            {t("tagline")}
          </p>
        </div>

        <div
          className="reveal rounded-3xl border border-border bg-card p-5 shadow-pop sm:p-6"
          style={stagger(3)}
        >
          <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="login" className="flex-1">{t("tabs.signIn")}</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">{t("tabs.createAccount")}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {tab === "login" ? t("switch.newHere") : t("switch.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => setTab(tab === "login" ? "register" : "login")}
              className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {tab === "login" ? t("switch.createAccount") : t("switch.signIn")}
            </button>
          </p>
        </div>
        <LegalLinks className="mt-6 justify-center" />
      </div>
    </main>
  );
}
