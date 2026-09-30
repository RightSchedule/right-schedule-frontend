import type { CSSProperties } from "react";
import { cn } from "cn";

const BLOBS = [
  { c: "var(--aurora-1)", size: "70vmax", x: "-20%", y: "-30%" },
  { c: "var(--aurora-2)", size: "55vmax", x: "45%", y: "35%" },
];

export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export function Aurora({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "app";
  className?: string;
}) {
  if (variant === "app") return null;
  return (
    <div aria-hidden className={cn("aurora", className)}>
      {BLOBS.map((b, i) => (
        <i
          key={i}
          className="aurora-blob"
          style={{ "--c": b.c, "--size": b.size, "--x": b.x, "--y": b.y } as CSSProperties}
        />
      ))}
    </div>
  );
}
