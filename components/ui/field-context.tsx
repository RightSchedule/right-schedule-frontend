"use client"

import { createContext, useContext } from "react"

interface FieldContextValue {
  describedBy?: string
  invalid: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

export function useFieldControlProps(props: {
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling"
}) {
  const field = useContext(FieldContext)
  const describedBy = [props["aria-describedby"], field?.describedBy].filter(Boolean).join(" ")
  return {
    "aria-describedby": describedBy || undefined,
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid ? true : undefined),
  }
}
