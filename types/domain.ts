export type BookingStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type ExceptionType = "VACATION" | "PERSONAL" | "OTHER";

export interface Business {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone: string;
  /** Language of emails sent to the business ("en" | "pt"). */
  locale?: string;
  logoUrl?: string;
  /** Party size limit for services that don't set their own. */
  defaultMaxPartySize?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  /** Per-service party size limit; null inherits the business default. */
  maxPartySize?: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHours {
  id: string;
  staffId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface AvailabilityException {
  id: string;
  staffId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: ExceptionType;
  reason?: string;
}

export interface Staff {
  id: string;
  businessId: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface Booking {
  id: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  customerId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string | null;
  /** People covered by this booking; absent on legacy rows means 1. */
  partySize?: number;
  /** Server-computed total (price × partySize). */
  totalPrice?: number;
  /** Set while a CONFIRMED booking is overdue for resolution; cleared by complete, no-show or cancel. */
  needsReviewAt?: string | null;
  /** Language of emails sent to the customer ("en" | "pt"). */
  locale?: string;
  service?: Service;
  staff?: Pick<Staff, "id" | "name">;
  customer?: Customer;
}

export type QuoteStatus =
  | "PENDING"
  | "QUOTED"
  | "ACCEPTED"
  | "DECLINED"
  | "CUSTOMER_DECLINED"
  | "CONVERTED";

export interface QuoteRequest {
  id: string;
  businessId: string;
  serviceId: string | null;
  status: QuoteStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  description: string;
  quotedAmount: number | null;
  responseMessage?: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bookingId?: string | null;
}

/** What a customer sees behind the emailed booking link. */
export interface ManagedBooking {
  id: string;
  status: BookingStatus;
  startDateTime: string;
  endDateTime: string;
  businessName: string;
  businessSlug: string;
  serviceId: string;
  serviceName: string;
  staffId?: string | null;
  staffName?: string | null;
  canCancel: boolean;
  canReschedule: boolean;
}

/** What a customer sees behind the emailed quote link. */
export interface ManagedQuote {
  status: QuoteStatus;
  businessName: string;
  serviceName?: string | null;
  description: string;
  quotedAmount: number | null;
  responseMessage?: string | null;
  respondedAt?: string | null;
  createdAt: string;
}

export interface BookingSettings {
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  cancellationWindowMinutes: number | null;
  slotIntervalMinutes: number;
}

export type PublicService = Pick<
  Service,
  "id" | "name" | "description" | "durationMinutes" | "price"
> & {
  /** Effective limit resolved by the backend (service override, else business default). */
  maxPartySize?: number;
};

export interface PublicStaff {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface PublicBusiness
  extends Pick<Business, "id" | "slug" | "name" | "email" | "phone" | "address" | "timezone" | "locale" | "logoUrl"> {
  services: PublicService[];
}

export type WaitlistStatus = "WAITING" | "NOTIFIED" | "BOOKED" | "CANCELLED";

export interface WaitlistEntry {
  id: string;
  serviceId: string;
  staffId: string | null;
  desiredDate: string;
  fromTime?: string | null;
  toTime?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  status: WaitlistStatus;
  notifiedAt?: string | null;
  createdAt: string;
}
