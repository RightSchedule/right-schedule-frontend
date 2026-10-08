"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LoadingButton } from "@/components/shared";
import { PublicLoading, PublicNotFound } from "@/features/bookings/components/PublicShell";
import { useManagedQuote, useRespondToManagedQuote } from "@/features/quotes/hooks/useQuotes";
import { useErrorMessage } from "@/lib/i18n/errors";
import { useLocaleFormat } from "@/lib/i18n/format";

export function ManageQuote({ token }: { token: string }) {
  const t = useTranslations("quotes.manage");
  const f = useLocaleFormat();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const query = useManagedQuote(token);
  const respond = useRespondToManagedQuote(token);

  if (query.isLoading) return <PublicLoading />;
  if (query.error || !query.data) {
    return <PublicNotFound error={query.error} onRetry={() => query.refetch()} tokenKind="quote" />;
  }
  const quote = query.data;

  const answer = async (response: "accept" | "decline") => {
    try {
      await respond.mutateAsync(response);
      toast.success(t(response === "accept" ? "accepted" : "declined"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <p className="text-sm text-muted-foreground">{quote.businessName}</p>
      <h1 className="mt-1 type-title">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("requestedOn", { date: f.date(quote.createdAt, "d MMMM yyyy") })}
        {quote.serviceName ? ` · ${quote.serviceName}` : ""}
      </p>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="text-xs font-semibold text-muted-foreground">{t("yourRequest")}</h2>
        <p className="mt-1 whitespace-pre-line text-sm">{quote.description}</p>
      </section>

      {quote.quotedAmount != null && (
        <section className="mt-4 rounded-lg border border-border bg-card p-4">
          <h2 className="text-xs font-semibold text-muted-foreground">{t("quote")}</h2>
          <p className="mt-1 text-2xl font-semibold">{f.price(quote.quotedAmount)}</p>
          {quote.responseMessage && (
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{quote.responseMessage}</p>
          )}
        </section>
      )}

      {quote.status === "QUOTED" ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <LoadingButton loading={respond.isPending} onClick={() => answer("accept")}>
            {t("accept")}
          </LoadingButton>
          <Button variant="outline" disabled={respond.isPending} onClick={() => answer("decline")}>
            {t("decline")}
          </Button>
        </div>
      ) : (
        <p role="status" className="mt-6 text-sm text-muted-foreground">
          {t(`state.${quote.status}`)}
        </p>
      )}
    </main>
  );
}
