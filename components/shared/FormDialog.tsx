"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/shared";
import { cn } from "cn";

/** Dialog shell shared by entity forms; the form is only mounted while open so state resets. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && children}
      </DialogContent>
    </Dialog>
  );
}

export function FormActions({
  submitLabel,
  loading,
  onCancel,
}: {
  submitLabel: string;
  loading: boolean;
  onCancel?: () => void;
}) {
  const tc = useTranslations("common.actions");
  return (
    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {tc("cancel")}
        </Button>
      )}
      <LoadingButton type="submit" loading={loading}>
        {submitLabel}
      </LoadingButton>
    </div>
  );
}
