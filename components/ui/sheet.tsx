"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "cn"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: DialogPrimitive.Popup.Props & { side?: "right" | "left" | "bottom" }) {
  const t = useTranslations("common.actions")
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/45 transition-opacity data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0" />
      <DialogPrimitive.Popup
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-card p-6 shadow-pop data-[open]:animate-in data-[closed]:animate-out",
          side === "bottom"
            ? "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl border-t border-border pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[closed]:slide-out-to-bottom data-[open]:slide-in-from-bottom"
            : "inset-y-0 h-full w-full max-w-sm",
          side === "right" &&
            "right-0 data-[closed]:slide-out-to-right data-[open]:slide-in-from-right",
          side === "left" && "left-0 data-[closed]:slide-out-to-left data-[open]:slide-in-from-left",
          className
        )}
        {...props}
      >
        <DialogPrimitive.Close className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <X className="size-4" />
          <span className="sr-only">{t("close")}</span>
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props} />
  )
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("font-heading text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
