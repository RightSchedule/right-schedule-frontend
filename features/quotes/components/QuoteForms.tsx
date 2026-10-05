"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useConvertQuote, useDeclineQuote, useDeleteQuote, useSendQuote } from "@/features/quotes/hooks/useQuotes";
import { useServices } from "@/features/services/hooks/useServices";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { useErrorMessage } from "@/lib/i18n/errors";
import { businessToday } from "@/lib/utils/clock";
import { LIMITS } from "@/lib/validation";
import type { QuoteRequest } from "@/types/domain";

const AMOUNT_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/;

type ErrorsTranslator = ReturnType<typeof useTranslations<"quotes.quoteForm.errors">>;

function makeQuoteSchema(t: ErrorsTranslator) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, t("amountRequired"))
      .regex(AMOUNT_PATTERN, t("amountInvalid")),
    message: z.string().max(LIMITS.quoteMessage, t("messageTooLong")),
  });
}

type QuoteValues = z.infer<ReturnType<typeof makeQuoteSchema>>;

export function QuoteForm({ request, onBack, onDone }: { request: QuoteRequest; onBack: () => void; onDone: () => void }) {
  const t = useTranslations("quotes.quoteForm");
  const tErrors = useTranslations("quotes.quoteForm.errors");
  const tDetail = useTranslations("quotes.detail");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const send = useSendQuote();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => makeQuoteSchema(tErrors), [tErrors]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteValues>({ resolver: zodResolver(schema), defaultValues: { amount: "", message: "" } });

  async function onSubmit(values: QuoteValues) {
    setError(null);
    try {
      await send.mutateAsync({
        id: request.id,
        amount: Number(values.amount.replace(",", ".")),
        message: values.message.trim() || undefined,
      });
      toast.success(t("sent", { email: request.customerEmail }));
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>
          {t("description", { name: request.customerName, email: request.customerEmail })}
        </DialogDescription>
      </DialogHeader>
      <Field label={t("amount")} htmlFor="quote-amount" error={errors.amount?.message} hint={t("amountHint")}>
        <Input
          id="quote-amount"
          inputMode="decimal"
          autoComplete="off"
          className="font-mono"
          aria-invalid={!!errors.amount}
          {...register("amount")}
        />
      </Field>
      <Field label={t("message")} htmlFor="quote-message" error={errors.message?.message}>
        <Textarea
          id="quote-message"
          rows={4}
          placeholder={t("messagePlaceholder")}
          aria-invalid={!!errors.message}
          {...register("message")}
        />
      </Field>
      <FormError message={error} />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack}>
          {tDetail("back")}
        </Button>
        <LoadingButton type="submit" loading={send.isPending}>
          {t("submit")}
        </LoadingButton>
      </div>
    </form>
  );
}

export function ConvertForm({ request, onBack, onDone }: { request: QuoteRequest; onBack: () => void; onDone: () => void }) {
  const t = useTranslations("quotes.convertForm");
  const tDetail = useTranslations("quotes.detail");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const convert = useConvertQuote();
  const business = useBusiness().data;
  const staff = useStaff().data;
  const services = useServices().data;
  const [date, setDate] = useState(() => businessToday(business?.timezone));
  const [time, setTime] = useState("09:00");
  const [staffId, setStaffId] = useState("");
  const [serviceChoice, setServiceChoice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const needsService = !request.serviceId;
  const activeServices = (services ?? []).filter((s) => s.active);
  const activeStaff = (staff ?? []).filter((s) => s.active);
  const ready = !!date && !!time && (!needsService || !!serviceChoice);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setError(null);
    try {
      await convert.mutateAsync({
        id: request.id,
        startDateTime: `${date}T${time}:00`,
        serviceId: needsService ? serviceChoice : undefined,
        staffId: staffId || undefined,
      });
      toast.success(t("converted"));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description", { name: request.customerName })}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("date")} htmlFor="convert-date">
          <Input id="convert-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("time")} htmlFor="convert-time">
          <Input id="convert-time" type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      {needsService && (
        <Field label={t("service")} htmlFor="convert-service">
          <Select id="convert-service" value={serviceChoice} onChange={(e) => setServiceChoice(e.target.value)}>
            <option value="">{t("servicePlaceholder")}</option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t("staff")} htmlFor="convert-staff" hint={t("staffHint")}>
        <Select id="convert-staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
          <option value="">{t("anyStaff")}</option>
          {activeStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormError message={error} />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack}>
          {tDetail("back")}
        </Button>
        <LoadingButton type="submit" loading={convert.isPending} disabled={!ready}>
          {t("submit")}
        </LoadingButton>
      </div>
    </form>
  );
}

export function DeclineForm({ request, onBack, onDone }: { request: QuoteRequest; onBack: () => void; onDone: () => void }) {
  const t = useTranslations("quotes.declineForm");
  const tDetail = useTranslations("quotes.detail");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const decline = useDeclineQuote();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await decline.mutateAsync({ id: request.id, message: message.trim() || undefined });
      toast.success(t("declined"));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description", { name: request.customerName })}</DialogDescription>
      </DialogHeader>
      <Field label={t("message")} htmlFor="decline-message">
        <Textarea
          id="decline-message"
          rows={3}
          maxLength={LIMITS.quoteMessage}
          placeholder={t("messagePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>
      <FormError message={error} />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack}>
          {tDetail("back")}
        </Button>
        <LoadingButton type="submit" variant="destructive" loading={decline.isPending}>
          {t("submit")}
        </LoadingButton>
      </div>
    </form>
  );
}

export function DeleteForm({ request, onBack, onDone }: { request: QuoteRequest; onBack: () => void; onDone: () => void }) {
  const t = useTranslations("quotes.deleteForm");
  const tDetail = useTranslations("quotes.detail");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const remove = useDeleteQuote();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await remove.mutateAsync(request.id);
      toast.success(t("deleted"));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description", { name: request.customerName })}</DialogDescription>
      </DialogHeader>
      <FormError message={error} />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack}>
          {tDetail("back")}
        </Button>
        <LoadingButton type="submit" variant="destructive" loading={remove.isPending}>
          {t("submit")}
        </LoadingButton>
      </div>
    </form>
  );
}
