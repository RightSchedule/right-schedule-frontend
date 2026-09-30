import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
  { href: "/dpa", key: "dpa" },
  { href: "/sub-processors", key: "subProcessors" },
] as const;

export function LegalLinks({
  className,
  keys = ["privacy", "terms", "dpa", "subProcessors"],
}: {
  className?: string;
  keys?: ReadonlyArray<(typeof LINKS)[number]["key"]>;
}) {
  const t = useTranslations("legal.nav");
  return (
    <nav aria-label="Legal" className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {LINKS.filter((l) => keys.includes(l.key)).map((l) => (
        <Link key={l.key} href={l.href} className="hover:text-foreground hover:underline">
          {t(l.key)}
        </Link>
      ))}
    </nav>
  );
}
