"use client"

import { cn } from "cn"
import { useFieldControlProps } from "@/components/ui/field-context"

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const aria = useFieldControlProps(props)
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[88px] w-full rounded-2xl border border-input bg-muted/40 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive resize-none pointer-coarse:text-base",
        className
      )}
      {...props}
      {...aria}
    />
  )
}

export { Textarea }
