"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errors.page");
  const tActions = useTranslations("common.actions");
  return (
    <main
      role="alert"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center"
    >
      <h1 className="type-title">{t("errorTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("errorDescription")}</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => retry()}>{tActions("tryAgain")}</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
