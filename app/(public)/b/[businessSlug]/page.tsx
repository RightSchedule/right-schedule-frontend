import { BusinessLanding } from "@/features/bookings/components/BusinessLanding";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  return <BusinessLanding slug={businessSlug} />;
}
