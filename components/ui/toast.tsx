"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Info, XCircle, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "cn"

type ToastKind = "success" | "error" | "info"

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }
const STYLES: Record<ToastKind, string> = {
  success: "text-success",
  error: "text-destructive",
  info: "text-primary",
}
const DURATION: Record<ToastKind, number> = { success: 5000, info: 5000, error: 8000 }

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const t = useTranslations("common.toast")
  const [paused, setPaused] = useState(false)
  const Icon = ICONS[item.kind]

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => onDismiss(item.id), DURATION[item.kind])
    return () => clearTimeout(timer)
  }, [paused, item.id, item.kind, onDismiss])

  return (
    <div
      role={item.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2"
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", STYLES[item.kind])} aria-hidden />
      <p className="flex-1">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="-m-2.5 rounded-md p-2.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("dismiss")}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev.slice(-3), { id, kind, message }])
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end">
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}
