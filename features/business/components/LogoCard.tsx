"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FormError, LoadingButton, initials } from "@/components/shared";
import {
  LOGO_MAX_BYTES,
  LOGO_TYPES,
  LogoUploadError,
  useChangeLogo,
} from "@/features/business/hooks/useBusiness";
import { useErrorMessage } from "@/lib/i18n/errors";
import type { Business } from "@/types/domain";

export function LogoCard({ business }: { business: Business }) {
  const t = useTranslations("settings.logo");
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const change = useChangeLogo();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(file: File | null) {
    setError(null);
    try {
      await change.mutateAsync({ business, file });
      toast.success(file ? t("updated") : t("removed"));
    } catch (e) {
      setError(e instanceof LogoUploadError ? t("uploadFailed") : errorMessage(e));
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setError(t("badType"));
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(t("tooLarge", { size: LOGO_MAX_BYTES / 1024 / 1024 }));
      return;
    }
    void run(file);
  }

  return (
    <section aria-labelledby="logo-heading" className="flex flex-col gap-4">
      <h2 id="logo-heading" className="type-section">
        {t("title")}
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-16 rounded-md">
          {business.logoUrl && <AvatarImage src={business.logoUrl} alt="" />}
          <AvatarFallback className="rounded-md bg-primary text-xl font-semibold text-primary-foreground">
            {initials(business.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept={LOGO_TYPES.join(",")}
              className="sr-only"
              aria-label={t("choose")}
              tabIndex={-1}
              onChange={onPick}
            />
            <LoadingButton type="button" variant="outline" loading={change.isPending} onClick={() => input.current?.click()}>
              {business.logoUrl ? t("replace") : t("upload")}
            </LoadingButton>
            {business.logoUrl && (
              <Button type="button" variant="ghost" disabled={change.isPending} onClick={() => void run(null)}>
                {t("remove")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t("hint", { size: LOGO_MAX_BYTES / 1024 / 1024 })}</p>
        </div>
      </div>
      <FormError message={error} />
    </section>
  );
}
