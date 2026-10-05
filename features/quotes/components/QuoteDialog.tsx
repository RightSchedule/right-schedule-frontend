"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, NotebookText, Phone, Scissors, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DetailsRow } from "@/components/shared";
import { useLocaleFormat } from "@/lib/i18n/format";
import { QuoteStatusBadge } from "@/features/quotes/components/QuoteStatusBadge";
import type { QuoteRequest } from "@/types/domain";
import { QuoteForm, ConvertForm, DeclineForm, DeleteForm } from "@/features/quotes/components/QuoteForms";

function QuoteDetail({
  request,
  serviceName,
  onQuote,
  onConvert,
  onDecline,
  onDelete,
  onClose,
}: {
  request: QuoteRequest;
  serviceName?: string;
  onQuote: () => void;
  onConvert: () => void;
  onDecline: () => void;
  onDelete: () => void;
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
        <DetailsRow icon={Scissors}>{serviceName ?? t("list.generalRequest")}</DetailsRow>
        <DetailsRow icon={User}>
          <span className="font-medium">{request.customerName}</span>
        </DetailsRow>
        <DetailsRow icon={Mail}>
          <a href={`mailto:${request.customerEmail}`} className="break-all hover:underline">
            {request.customerEmail}
          </a>
        </DetailsRow>
        {request.customerPhone && (
          <DetailsRow icon={Phone}>
            <a href={`tel:${request.customerPhone}`} className="hover:underline">
              {request.customerPhone}
            </a>
          </DetailsRow>
        )}
        <DetailsRow icon={NotebookText}>
          <p className="whitespace-pre-wrap break-words">{request.description}</p>
        </DetailsRow>
      </div>

      {answered && (
        <div className="rounded-md bg-muted/60 p-4">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("detail.yourAnswer")}
          </p>
          {request.quotedAmount !== null && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">{t("detail.quotedAmount")}: </span>
              <span className="font-mono text-base font-semibold">{f.price(request.quotedAmount)}</span>
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
        <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto" onClick={onDelete}>
          {t("detail.delete")}
        </Button>
        {request.status === "PENDING" ? (
          <>
            <Button variant="outline" onClick={onDecline}>
              {t("detail.decline")}
            </Button>
            <Button onClick={onQuote}>{t("detail.sendQuote")}</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              {t("detail.close")}
            </Button>
            {request.status === "ACCEPTED" && (
              <Button onClick={onConvert}>{t("detail.convert")}</Button>
            )}
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
  const [mode, setMode] = useState<"view" | "quote" | "convert" | "decline" | "delete">("view");

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
            onConvert={() => setMode("convert")}
            onDecline={() => setMode("decline")}
            onDelete={() => setMode("delete")}
            onClose={() => handleOpenChange(false)}
          />
        )}
        {request && mode === "quote" && (
          <QuoteForm request={request} onBack={() => setMode("view")} onDone={() => handleOpenChange(false)} />
        )}
        {request && mode === "convert" && (
          <ConvertForm request={request} onBack={() => setMode("view")} onDone={() => handleOpenChange(false)} />
        )}
        {request && mode === "decline" && (
          <DeclineForm request={request} onBack={() => setMode("view")} onDone={() => handleOpenChange(false)} />
        )}
        {request && mode === "delete" && (
          <DeleteForm request={request} onBack={() => setMode("view")} onDone={() => handleOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
