"use client";

import { ErrorState, PageContainer } from "@/components/shared";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState error={error} onRetry={() => retry()} />
    </PageContainer>
  );
}
