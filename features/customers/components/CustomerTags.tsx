"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerTags, useReplaceCustomerTags } from "@/features/customers/hooks/useCustomers";
import { useErrorMessage } from "@/lib/i18n/errors";

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 30;

export function CustomerTags({ customerId }: { customerId: string }) {
  const t = useTranslations("customers.tags");
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const query = useCustomerTags(customerId);
  const replace = useReplaceCustomerTags(customerId);
  const [draft, setDraft] = useState("");

  if (query.isLoading) return <Skeleton className="mb-6 h-8 w-48 rounded-md" />;
  if (query.error || !query.data) return null;
  const tags = query.data;

  async function save(next: string[]) {
    try {
      await replace.mutateAsync(next);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      toast.error(t("duplicate"));
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(t("limit", { count: MAX_TAGS }));
      return;
    }
    setDraft("");
    await save([...tags, value]);
  }

  return (
    <section aria-labelledby="customer-tags-heading" className="mb-8">
      <h2 id="customer-tags-heading" className="mb-2 text-sm font-semibold text-muted-foreground">
        {t("title")}
      </h2>
      <ul className="mb-3 flex flex-wrap gap-2">
        {tags.length === 0 && <li className="text-sm text-muted-foreground">{t("empty")}</li>}
        {tags.map((tag) => (
          <li key={tag}>
            <Badge variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                aria-label={t("remove", { tag })}
                disabled={replace.isPending}
                onClick={() => void save(tags.filter((x) => x !== tag))}
                className="flex size-5 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex max-w-sm gap-2">
        <Input
          aria-label={t("add")}
          placeholder={t("placeholder")}
          maxLength={MAX_TAG_LENGTH}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={replace.isPending || !draft.trim()}>
          <Plus /> {t("add")}
        </Button>
      </form>
    </section>
  );
}
