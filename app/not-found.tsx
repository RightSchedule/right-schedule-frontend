import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors.page");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 type-title">{t("notFoundTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("notFoundDescription")}</p>
      <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        {t("home")}
      </Link>
    </main>
  );
}
