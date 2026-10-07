"use client"

import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import { useFieldControlProps } from "@/components/ui/field-context"

function Input({ className, ...props }: InputPrimitive.Props) {
  const aria = useFieldControlProps(props)
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-card px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 pointer-coarse:text-base",
        className
      )}
      {...props}
      {...aria}
    />
  )
}

export { Input }
