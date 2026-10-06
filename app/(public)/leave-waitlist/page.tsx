import { EmailTokenPage } from "@/features/auth/components/EmailTokenPage";
import { PublicNotFound } from "@/features/bookings/components/PublicShell";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <PublicNotFound tokenKind="waitlist" />;
  return <EmailTokenPage kind="leaveWaitlist" token={token} />;
}
