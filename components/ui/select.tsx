"use client"

import { cn } from "cn"
import { useFieldControlProps } from "@/components/ui/field-context"

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const aria = useFieldControlProps(props)
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-card px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive pointer-coarse:text-base",
        className
      )}
      {...props}
      {...aria}
    />
  )
}

export { Select }
