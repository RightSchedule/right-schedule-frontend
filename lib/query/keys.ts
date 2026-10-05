export const qk = {
  business: ["business"] as const,
  bookingSettings: ["business", "booking-settings"] as const,
  services: ["services"] as const,
  staff: {
    all: ["staff"] as const,
    one: (id: string) => ["staff", id] as const,
    services: (id: string) => ["staff", id, "services"] as const,
    workingHours: (id: string) => ["staff", id, "working-hours"] as const,
    exceptions: (id: string) => ["staff", id, "exceptions"] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    range: (from?: string, to?: string, customerId?: string) =>
      ["bookings", "range", from ?? null, to ?? null, customerId ?? null] as const,
    customerHistory: (customerId: string, sort: string, page: number) =>
      ["bookings", "customer-history", customerId, sort, page] as const,
    review: (page: number) => ["bookings", "review", page] as const,
    reviewCount: ["bookings", "review-count"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    dashboard: (from: string, to: string) => ["analytics", "dashboard", from, to] as const,
  },
  customers: {
    all: ["customers"] as const,
    lists: ["customers", "list"] as const,
    list: (search: string, page: number) => ["customers", "list", search, page] as const,
    one: (id: string) => ["customers", "one", id] as const,
  },
  quotes: {
    all: ["quotes"] as const,
    list: (status: string | null, page: number) => ["quotes", "list", status, page] as const,
    pending: ["quotes", "pending-count"] as const,
  },
  waitlist: {
    all: ["waitlist"] as const,
    list: (status: string | null, page: number) => ["waitlist", "list", status, page] as const,
  },
  public: {
    business: (slug: string) => ["public", "business", slug] as const,
    managedBooking: (token: string) => ["public", "managed-booking", token] as const,
    reviews: (slug: string, page: number) => ["public", "reviews", slug, page] as const,
    managedQuote: (token: string) => ["public", "managed-quote", token] as const,
    staff: (slug: string, serviceId: string | null) =>
      ["public", "staff", slug, serviceId] as const,
    availabilityAll: ["public", "availability"] as const,
    availability: (
      slug: string,
      serviceId: string | null,
      staffId: string | null,
      date: string | null,
      partySize = 1
    ) => ["public", "availability", slug, serviceId, staffId, date, partySize] as const,
  },
};
