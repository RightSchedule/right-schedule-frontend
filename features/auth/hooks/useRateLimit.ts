"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api/client";

export function useRateLimit() {
  const t = useTranslations("errors");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  /** Starts the countdown and returns true when the error is a 429. */
  const handle = useCallback((error: unknown) => {
    if (!(error instanceof ApiError) || error.status !== 429) return false;
    setRemaining(Math.ceil(error.retryAfter ?? 30));
    return true;
  }, []);

  return {
    limited: remaining > 0,
    message: remaining > 0 ? t("tooManyAttemptsRetry", { seconds: remaining }) : null,
    handle,
  };
}
