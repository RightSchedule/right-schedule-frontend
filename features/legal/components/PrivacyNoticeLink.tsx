"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function PrivacyNoticeLink({ slug, business }: { slug: string; business: string }) {
  const t = useTranslations("legal.customerNotice");
  return (
    <p className="text-center text-xs text-muted-foreground">
      {t.rich("line", {
        business,
        notice: (chunks) => (
          <Link href={`/b/${slug}/privacy`} className="font-medium underline hover:text-foreground">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
