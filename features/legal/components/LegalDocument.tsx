import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import type { LegalDoc } from "@/features/legal/content";

export function LegalDocument({
  doc,
  updated,
  backHref,
  backLabel,
  children,
}: {
  doc: LegalDoc;
  updated?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      {backHref && (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {backLabel}
        </Link>
      )}
      <article className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <h1 className="type-title">{doc.title}</h1>
        {updated && <p className="mt-1 text-xs text-muted-foreground">{updated}</p>}
        {doc.intro && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{doc.intro}</p>}
        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-6">
            <h2 className="text-base font-semibold">{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {children}
      </article>
      <LegalLinks className="mt-6 justify-center" />
    </main>
  );
}
