import { EmailTokenPage } from "@/features/auth/components/EmailTokenPage";
import { PublicNotFound } from "@/features/bookings/components/PublicShell";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <PublicNotFound tokenKind="verifyEmail" />;
  return <EmailTokenPage kind="verifyEmail" token={token} />;
}
