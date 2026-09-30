import { BookingWizard } from "@/features/bookings/components/BookingWizard";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { businessSlug } = await params;
  const { service } = await searchParams;
  return <BookingWizard slug={businessSlug} initialServiceId={service} />;
}
