import { ManageBooking } from "@/features/bookings/components/ManageBooking";
import { PublicNotFound } from "@/features/bookings/components/PublicShell";

export default async function ManageBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) return <PublicNotFound />;
  return <ManageBooking token={token} />;
}
