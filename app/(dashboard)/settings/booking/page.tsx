"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BookingLinkCard } from "@/features/business/components/BookingLinkCard";
import { BookingRulesCard } from "@/features/business/components/BookingRulesCard";
import { useBusiness } from "@/features/business/hooks/useBusiness";

export default function BookingSettingsPage() {
  const { data: business } = useBusiness();
  return (
    <div className="flex flex-col gap-8">
      {business ? <BookingLinkCard slug={business.slug} /> : <Skeleton className="h-40 rounded-lg" />}
      <BookingRulesCard part="booking" />
    </div>
  );
}
