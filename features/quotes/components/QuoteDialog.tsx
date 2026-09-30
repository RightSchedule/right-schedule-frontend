"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Mail, NotebookText, Phone, Scissors, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { useDeclineQuote, useSendQuote } from "@/features/quotes/hooks/useQuotes";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";
import type { QuoteRequest, QuoteStatus } from "@/types/domain";

export function quoteStatusVariant(status: QuoteStatus) {
  switch (status) {
    case "PENDING":
      return "pending" as const;
    case "QUOTED":
      return "success" as const;
    case "DECLINED":
      return "secondary" as const;
  }
}

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const t = useTranslations("quotes.status");
  return (
    <Badge variant={quoteStatusVariant(status)} className={className}>
      {t(status)}
    </Badge>
  );
}

const AMOUNT_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/;

type ErrorsTranslator = ReturnType<typeof useTranslations<"quotes.quoteForm.errors">>;

function makeQuoteSchema(t: ErrorsTranslator) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, t("amountRequired"))
      .regex(AMOUNT_PATTERN, t("amountInvalid")),
    message: z.string().max(2000, t("messageTooLong")),
  });
}

type QuoteValues = z.infer<ReturnType<typeof makeQuoteSchema>>;

function Row({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3.5 text-[0.95rem]">
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function QuoteForm({ request, onBack, onDone }: { request: QuoteRequest; onBack: () => void; onDone: () => void }) {
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

function DeclineForm({ request, onBack, onDone }: { request: QuoteRequest; onBack: () => void; onDone: () => void }) {
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
          maxLength={2000}
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

function QuoteDetail({
  request,
  serviceName,
  onQuote,
  onDecline,
  onClose,
}: {
  request: QuoteRequest;
  serviceName?: string;
  onQuote: () => void;
  onDecline: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("quotes");
  const f = useLocaleFormat();
  const answered = request.status !== "PENDING";

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2.5">
          <DialogTitle>{request.customerName}</DialogTitle>
          <QuoteStatusBadge status={request.status} />
        </div>
        <DialogDescription>
          {t("detail.received", { date: f.date(request.createdAt, "d MMM yyyy, HH:mm") })}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 border-y border-border py-5">
        <Row icon={Scissors}>{serviceName ?? t("list.generalRequest")}</Row>
        <Row icon={User}>
          <span className="font-medium">{request.customerName}</span>
        </Row>
        <Row icon={Mail}>
          <a href={`mailto:${request.customerEmail}`} className="break-all hover:underline">
            {request.customerEmail}
          </a>
        </Row>
        {request.customerPhone && (
          <Row icon={Phone}>
            <a href={`tel:${request.customerPhone}`} className="hover:underline">
              {request.customerPhone}
            </a>
          </Row>
        )}
        <Row icon={NotebookText}>
          <p className="whitespace-pre-wrap break-words">{request.description}</p>
        </Row>
      </div>

      {answered && (
        <div className="rounded-2xl bg-muted/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("detail.yourAnswer")}
          </p>
          {request.quotedAmount !== null && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">{t("detail.quotedAmount")}: </span>
              <span className="font-mono text-base font-bold">{f.price(request.quotedAmount)}</span>
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {request.responseMessage || (
              <span className="text-muted-foreground">{t("detail.noMessage")}</span>
            )}
          </p>
          {request.respondedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("detail.answeredOn", { date: f.date(request.respondedAt, "d MMM yyyy, HH:mm") })}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {answered ? (
          <Button variant="outline" onClick={onClose}>
            {t("detail.close")}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onDecline}>
              {t("detail.decline")}
            </Button>
            <Button onClick={onQuote}>{t("detail.sendQuote")}</Button>
          </>
        )}
      </div>
    </>
  );
}

export function QuoteDialog({
  request,
  serviceName,
  onOpenChange,
}: {
  request: QuoteRequest | null;
  serviceName?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"view" | "quote" | "decline">("view");

  function handleOpenChange(open: boolean) {
    if (!open) setMode("view");
    onOpenChange(open);
  }

  return (
    <Dialog open={!!request} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        {request && mode === "view" && (
          <QuoteDetail
            request={request}
            serviceName={serviceName}
            onQuote={() => setMode("quote")}
            onDecline={() => setMode("decline")}
            onClose={() => handleOpenChange(false)}
          />
        )}
        {request && mode === "quote" && (
          <QuoteForm request={request} onBack={() => setMode("view")} onDone={() => handleOpenChange(false)} />
        )}
        {request && mode === "decline" && (
          <DeclineForm request={request} onBack={() => setMode("view")} onDone={() => handleOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
