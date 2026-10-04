"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { useRateLimit } from "@/features/auth/hooks/useRateLimit";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import { accountApi } from "@/lib/api/account";
import { useErrorMessage } from "@/lib/i18n/errors";
import { downloadJson } from "@/lib/utils/download";

function DeleteAccountForm({ onCancel }: { onCancel: () => void }) {
  const t = useTranslations("settings.privacy");
  const tActions = useTranslations("common.actions");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rateLimit = useRateLimit();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const remove = useMutation({ mutationFn: () => accountApi.remove(password) });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await remove.mutateAsync();
      queryClient.clear();
      router.push("/login");
    } catch (err) {
      if (rateLimit.handle(err)) return;
      setError(errorMessage(err, { overrides: { 400: t("wrongPassword"), 401: t("wrongPassword") } }));
    } finally {
      setPassword("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogDescription>{t("deleteDescription")}</DialogDescription>
      </DialogHeader>
      <Field label={t("password")} htmlFor="delete-password">
        <Input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <FormError message={rateLimit.message ?? error} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {tActions("cancel")}
        </Button>
        <LoadingButton
          type="submit"
          variant="destructive"
          loading={remove.isPending}
          disabled={!password || rateLimit.limited}
        >
          {t("deleteConfirm")}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}

export function PrivacyCard() {
  const t = useTranslations("settings.privacy");
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const exportData = useMutation({
    mutationFn: async () => downloadJson(await accountApi.export(), "rightschedule-export.json"),
  });

  async function onExport() {
    try {
      await exportData.mutateAsync();
      toast.success(t("exported"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={exportData.isPending} onClick={onExport}>
          <Download /> {t("export")}
        </Button>
        <Button variant="destructive" onClick={() => setDeleting(true)}>
          <Trash2 /> {t("delete")}
        </Button>
      </div>
      <LegalLinks />
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent className="max-w-md">
          {deleting && <DeleteAccountForm onCancel={() => setDeleting(false)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
