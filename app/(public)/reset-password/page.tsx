import { ResetPassword } from "@/features/auth/components/PasswordRecovery";
import { PublicNotFound } from "@/features/bookings/components/PublicShell";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <PublicNotFound tokenKind="resetPassword" />;
  return <ResetPassword token={token} />;
}
