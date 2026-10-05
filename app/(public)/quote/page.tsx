import { PublicNotFound } from "@/features/bookings/components/PublicShell";
import { ManageQuote } from "@/features/quotes/components/ManageQuote";

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) return <PublicNotFound />;
  return <ManageQuote token={token} />;
}
