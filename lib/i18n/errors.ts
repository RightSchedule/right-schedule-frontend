import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api/client";

interface ErrorMessageOptions {
  /** Translated messages that win per HTTP status, e.g. `{ 401: t("wrongPassword") }`. */
  overrides?: Partial<Record<number, string>>;
  /** Translated message when nothing more specific applies. */
  fallback?: string;
}

/**
 * Returns a resolver from API failure to a translated user-facing message.
 * Order: status override, backend error `code` (errors.codes.*), rate limit, network, fallback.
 */
export function useErrorMessage() {
  const t = useTranslations("errors");

  return (error: unknown, { overrides = {}, fallback }: ErrorMessageOptions = {}): string => {
    if (error instanceof ApiError) {
      const override = overrides[error.status];
      if (override) return override;
      if (error.code && t.has(`codes.${error.code}` as never)) {
        return t(`codes.${error.code}` as never);
      }
      if (error.status === 429) {
        return error.retryAfter
          ? t("tooManyAttemptsRetry", { seconds: error.retryAfter })
          : t("tooManyAttempts");
      }
      if (error.status === 422) return t("requestChanged");
      if (error.detail && error.status < 500) return error.detail;
      return fallback ?? t("generic");
    }
    if (error instanceof TypeError) return t("network");
    // Errors thrown by our own code carry an already-translated message.
    if (error instanceof Error && error.message) return error.message;
    return fallback ?? t("generic");
  };
}
