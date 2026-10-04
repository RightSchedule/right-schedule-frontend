import type { CSSProperties, ReactNode } from "react";
import { brandHue } from "@/lib/utils/brand";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  return (
    <div data-brand style={{ "--brand-hue": brandHue(businessSlug) } as CSSProperties}>
      {children}
    </div>
  );
}
