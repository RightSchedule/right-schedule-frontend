"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError, LoadingButton } from "@/components/shared";

export const REASON_MIN = 3;
export const REASON_MAX = 500;

/** Mirrors the backend rule (3-500 characters after trimming); returns a message key or null. */
export function reasonError(reason: string): "tooShort" | "tooLong" | null {
  const length = reason.trim().length;
  if (length < REASON_MIN) return "tooShort";
  if (length > REASON_MAX) return "tooLong";
  return null;
}

/** Confirmation for a destructive admin action that must record why it was taken. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loading,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  /** Translated server error to show inside the dialog. */
  error?: string | null;
  onConfirm: (reason: string) => void;
}) {
  const t = useTranslations("admin.reason");
  const tc = useTranslations("common.actions");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const problem = reasonError(reason);

  function close(next: boolean) {
    if (!next) {
      setReason("");
      setTouched(false);
    }
    onOpenChange(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (problem) return;
    onConfirm(reason.trim());
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field
            label={t("label")}
            htmlFor="admin-reason"
            hint={t("hint")}
            error={touched && problem ? t(problem) : undefined}
          >
            <Textarea
              id="admin-reason"
              value={reason}
              maxLength={REASON_MAX + 50}
              placeholder={t("placeholder")}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </Field>
          <FormError message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              {tc("cancel")}
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              className="border-transparent bg-destructive text-white hover:bg-destructive/90"
            >
              {confirmLabel}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
