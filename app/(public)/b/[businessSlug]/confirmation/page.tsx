import { redirect } from "next/navigation";
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
  if (!id) redirect(`/b/${businessSlug}`);
  return <BookingConfirmation slug={businessSlug} bookingId={id} />;
}
