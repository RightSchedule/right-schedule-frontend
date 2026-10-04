import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { LegalLinks } from "@/features/legal/components/LegalLinks";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("public.shell");
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-lg justify-end px-4 pt-3">
        <LanguageSwitcher />
      </div>
      <div className="flex-1">{children}</div>
      <footer className="flex flex-col items-center gap-2 py-6 text-center text-xs text-muted-foreground">
        <span>
          {t.rich("poweredBy", {
            brand: (chunks) => (
              <span className="text-sm font-semibold text-primary">{chunks}</span>
            ),
          })}
        </span>
        <LegalLinks keys={["privacy", "terms"]} />
      </footer>
    </div>
  );
}
