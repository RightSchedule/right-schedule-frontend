import { PublicQuoteForm } from "@/features/quotes/components/PublicQuoteForm";

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { businessSlug } = await params;
  const { service } = await searchParams;
  return <PublicQuoteForm slug={businessSlug} initialServiceId={service} />;
}
