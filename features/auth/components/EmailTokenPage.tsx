"use client";

import { useTranslations } from "next-intl";
import { TokenAction } from "@/features/auth/components/TokenAction";
import { authApi } from "@/lib/api/auth";
import { waitlistApi } from "@/lib/api/waitlist";

type Kind = "verifyEmail" | "confirmEmailChange" | "leaveWaitlist";

const actions: Record<Kind, (token: string) => Promise<unknown>> = {
  verifyEmail: authApi.verifyEmail,
  confirmEmailChange: authApi.confirmEmailChange,
  leaveWaitlist: waitlistApi.leave,
};

export function EmailTokenPage({ kind, token }: { kind: Kind; token: string }) {
  const t = useTranslations(`auth.token.${kind}`);
  const tResend = useTranslations("auth.recovery.resend");
  return (
    <TokenAction
      token={token}
      action={actions[kind]}
      retryHref={kind === "verifyEmail" ? { href: "/resend-verification", label: tResend("link") } : undefined}
      auto={kind !== "leaveWaitlist"}
      messages={{
        title: t("title"),
        confirm: kind === "leaveWaitlist" ? t("confirm") : undefined,
        success: t("success"),
        failure: t("failure"),
      }}
    />
  );
}
