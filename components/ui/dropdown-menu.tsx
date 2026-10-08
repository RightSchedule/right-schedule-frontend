"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "cn";

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: number;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align={align} sideOffset={sideOffset} className="z-[60]">
        <MenuPrimitive.Popup
          className={cn(
            "min-w-52 rounded-md border border-border bg-card p-1 shadow-pop outline-none",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & { variant?: "default" | "destructive" }) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "flex min-h-10 w-full cursor-default select-none items-center gap-2.5 rounded-sm px-3 text-sm font-medium outline-none pointer-coarse:min-h-12 pointer-coarse:text-base [&_svg]:size-4 [&_svg]:shrink-0",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        variant === "destructive"
          ? "text-destructive data-[highlighted]:bg-destructive/10"
          : "text-foreground data-[highlighted]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
