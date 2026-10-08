"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
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
  onDelete,
  deleteLabel,
}: {
  submitLabel: string;
  loading: boolean;
  onCancel?: () => void;
  /** Edit forms offer a delete on the far left, away from the save button. */
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  const tc = useTranslations("common.actions");
  return (
    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
          onClick={onDelete}
        >
          <Trash2 /> {deleteLabel ?? tc("delete")}
        </Button>
      )}
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
