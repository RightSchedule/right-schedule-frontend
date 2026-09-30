import { BookingConfirmation } from "@/features/bookings/components/BookingConfirmation";

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { businessSlug } = await params;
  const { id } = await searchParams;
  return <BookingConfirmation slug={businessSlug} bookingId={id} />;
}
