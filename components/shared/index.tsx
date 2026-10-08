"use client";

import Link from "next/link";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Hourglass } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { isUnavailable } from "@/lib/api/client";
import { useErrorMessage } from "@/lib/i18n/errors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldContext } from "@/components/ui/field-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="type-page">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl p-4 pt-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start border-t border-border px-1 py-10">
      <Icon aria-hidden className="mb-3 size-5 text-muted-foreground" />
      <h3 className="font-heading text-xl font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Shows a "not available yet" state for endpoints from unfinished backend phases. */
export function ErrorState({
  error,
  onRetry,
  feature,
}: {
  error: unknown;
  onRetry?: () => void;
  feature?: string;
}) {
  const t = useTranslations("common");
  const errorMessage = useErrorMessage();
  const unavailable = isUnavailable(error);
  const Icon = unavailable ? Hourglass : AlertCircle;
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start rounded-md border-l-4 px-4 py-4",
        unavailable ? "border-warning bg-warning-muted" : "border-destructive bg-destructive/8"
      )}
    >
      <Icon
        aria-hidden
        className={cn("mb-2 size-5", unavailable ? "text-warning-foreground" : "text-destructive")}
      />
      <h3 className="font-semibold">
        {unavailable
          ? feature
            ? t("shared.unavailableTitle", { feature })
            : t("shared.unavailableTitleGeneric")
          : t("shared.loadErrorTitle")}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {unavailable ? t("shared.unavailableDescription") : errorMessage(error)}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          {t("actions.tryAgain")}
        </Button>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

export function LoadingButton({
  loading,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button {...props} disabled={props.disabled || loading}>
      {loading && <Spinner />}
      {children}
    </Button>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <FieldContext.Provider value={{ describedBy, invalid: !!error }}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={htmlFor}>{label}</Label>
        {children}
        {hint && !error && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
      {message}
    </p>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations("common.actions");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? t("cancel")}
          </Button>
          <LoadingButton
            variant={destructive ? "destructive" : "default"}
            className={destructive ? "border-transparent bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90" : undefined}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("confirm")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SkeletonList({
  count = 4,
  className = "h-16",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn("rounded-lg", className)} />
      ))}
    </div>
  );
}

export function ListContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      {children}
    </ul>
  );
}

const ROW_CLASS =
  "flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none";

export function EntityListRow({
  name,
  photoUrl,
  href,
  onClick,
  trailing,
  children,
}: {
  name: string;
  photoUrl?: string | null;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <Avatar className="size-11">
        {photoUrl && <AvatarImage src={photoUrl} alt="" />}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={ROW_CLASS}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={ROW_CLASS}>
          {content}
        </button>
      )}
    </li>
  );
}

export function PaginationNav({
  page,
  totalPages,
  disabled,
  onPageChange,
  label,
  previousLabel,
  nextLabel,
  pageLabel,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  label: string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={label} className="flex items-center justify-between text-sm">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 0 || disabled}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft /> {previousLabel}
      </Button>
      <span className="text-muted-foreground" aria-live="polite">
        {pageLabel}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page + 1 >= totalPages || disabled}
        onClick={() => onPageChange(page + 1)}
      >
        {nextLabel} <ChevronRight />
      </Button>
    </nav>
  );
}

export function DetailsRow({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
