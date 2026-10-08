"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "cn"

const TooltipProvider = TooltipPrimitive.Provider

/**
 * Hint shown on hover and keyboard focus. `children` is the element that triggers it (a link or
 * button); it keeps its own accessible name, since the tooltip is not announced as a label.
 */
function Tooltip({
  content,
  children,
  side = "right",
  disabled,
  className,
}: {
  content: React.ReactNode
  children: React.ReactElement<Record<string, unknown>>
  side?: TooltipPrimitive.Positioner.Props["side"]
  disabled?: boolean
  className?: string
}) {
  if (disabled) return children
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={8} className="z-[70]">
          <TooltipPrimitive.Popup
            className={cn(
              "rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-pop transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none",
              className
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
