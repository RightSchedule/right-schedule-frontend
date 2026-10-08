"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared";

/**
 * Appears at the bottom of a settings form once it has unsaved edits. Render it inside the `<form>`
 * so the save button submits it.
 */
export function SaveBar({
  dirty,
  loading,
  onDiscard,
}: {
  dirty: boolean;
  loading?: boolean;
  onDiscard: () => void;
}) {
  const t = useTranslations("common.saveBar");
  const tActions = useTranslations("common.actions");
  if (!dirty) return null;
  return (
    <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 mt-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-pop md:bottom-4">
      <p role="status" className="text-sm font-medium">
        {t("unsaved")}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" disabled={loading} onClick={onDiscard}>
          {t("discard")}
        </Button>
        <LoadingButton type="submit" loading={loading}>
          {tActions("saveChanges")}
        </LoadingButton>
      </div>
    </div>
  );
}
