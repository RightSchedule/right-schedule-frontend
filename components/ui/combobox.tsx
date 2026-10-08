"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "cn"
import { useFieldControlProps } from "@/components/ui/field-context"

/** Searchable single-select over a list of strings. Use instead of `<select>` once a list is long. */
function Combobox({
  id,
  items,
  value,
  onValueChange,
  placeholder,
  className,
}: {
  id?: string
  items: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const t = useTranslations("common.combobox")
  const aria = useFieldControlProps({})
  return (
    <ComboboxPrimitive.Root
      items={items}
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string" && next) onValueChange(next)
      }}
    >
      <ComboboxPrimitive.InputGroup className={cn("relative", className)}>
        <ComboboxPrimitive.Input
          id={id}
          placeholder={placeholder}
          autoComplete="off"
          className="flex h-10 w-full rounded-md border border-input bg-card py-1 pl-3 pr-10 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive pointer-coarse:text-base"
          {...aria}
        />
        <ComboboxPrimitive.Trigger
          aria-label={t("open")}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className="size-4" aria-hidden />
        </ComboboxPrimitive.Trigger>
      </ComboboxPrimitive.InputGroup>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-[60] outline-none">
          <ComboboxPrimitive.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] rounded-md border border-border bg-card shadow-pop">
            <ComboboxPrimitive.Empty className="px-3 py-3 text-sm text-muted-foreground empty:hidden">
              {t("empty")}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto overscroll-contain p-1 outline-none data-[empty]:p-0">
              {(item: string) => (
                <ComboboxPrimitive.Item
                  key={item}
                  value={item}
                  className="grid min-h-10 cursor-default select-none grid-cols-[1rem_1fr] items-center gap-2 rounded-sm px-2 text-sm outline-none data-[highlighted]:bg-muted pointer-coarse:min-h-12 pointer-coarse:text-base"
                >
                  <ComboboxPrimitive.ItemIndicator className="col-start-1">
                    <Check className="size-4" aria-hidden />
                  </ComboboxPrimitive.ItemIndicator>
                  <span className="col-start-2 truncate">{item}</span>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

export { Combobox }
