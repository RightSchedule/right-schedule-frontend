"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, CircleX } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { LoadingButton, Spinner } from "@/components/shared";
import { useErrorMessage } from "@/lib/i18n/errors";

/** Redeems an emailed one-time token. `auto` fires on mount; otherwise the user confirms with a button. */
export function TokenAction({
  token,
  action,
  messages,
  auto = true,
  retryHref,
}: {
  token: string;
  action: (token: string) => Promise<unknown>;
  messages: { title: string; confirm?: string; success: string; failure: string };
  auto?: boolean;
  retryHref?: { href: string; label: string };
}) {
  const tCommon = useTranslations("auth.token");
  const errorMessage = useErrorMessage();
  const mutation = useMutation({ mutationFn: action });
  const { mutate } = mutation;
  const fired = useRef(false);

  useEffect(() => {
    if (!auto || fired.current) return;
    fired.current = true;
    mutate(token);
  }, [auto, mutate, token]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      {mutation.isSuccess ? (
        <>
          <CircleCheck className="mb-4 size-8 text-success-foreground" aria-hidden />
          <h1 className="text-xl font-semibold">{messages.success}</h1>
          <Link href="/login" className={buttonVariants({ className: "mt-6" })}>
            {tCommon("signIn")}
          </Link>
        </>
      ) : mutation.isError ? (
        <div role="alert" className="flex flex-col items-center">
          <CircleX className="mb-4 size-8 text-destructive" aria-hidden />
          <h1 className="text-xl font-semibold">{messages.failure}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{errorMessage(mutation.error)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {retryHref && (
              <Link href={retryHref.href} className={buttonVariants()}>
                {retryHref.label}
              </Link>
            )}
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              {tCommon("signIn")}
            </Link>
          </div>
        </div>
      ) : auto ? (
        <div role="status" className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          <h1 className="text-xl font-semibold">{messages.title}</h1>
        </div>
      ) : (
        <>
          <h1 className="text-xl font-semibold">{messages.title}</h1>
          <LoadingButton
            className="mt-6"
            loading={mutation.isPending}
            onClick={() => mutate(token)}
          >
            {messages.confirm}
          </LoadingButton>
        </>
      )}
    </main>
  );
}
