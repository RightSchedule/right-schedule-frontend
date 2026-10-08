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
  /** True only when status is ACTIVE. */
  active: boolean;
  /** New businesses wait for platform approval before customers can see or book them. */
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
}

export type BusinessStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  /** Per-service party size limit; null inherits the business default. */
  maxPartySize?: number | null;
  /** null inherits (publicly bookable); false makes the service staff-only. */
  publicBookable?: boolean | null;
  /** null inherits the business buffer. */
  bufferMinutes?: number | null;
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
  /** null reuses the cancellation window. */
  rescheduleWindowMinutes: number | null;
  bufferMinutes: number;
  publicBookingEnabled: boolean;
  quotesEnabled: boolean;
  waitlistEnabled: boolean;
  reviewsEnabled: boolean;
  showReviewsPublicly: boolean;
  maxBookingsPerCustomerPerDay: number | null;
  maxActiveBookingsPerCustomer: number | null;
  notifyCustomerConfirmation: boolean;
  notifyBusinessNewBooking: boolean;
  /** 0 turns the customer reminder off. */
  reminderLeadHours: 0 | 2 | 24;
}

/** Customer-facing subset of the booking policy; clients hide whatever is switched off. */
export interface PublicPolicy {
  bookingEnabled: boolean;
  quotesEnabled: boolean;
  waitlistEnabled: boolean;
  reviewsEnabled: boolean;
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
  policy?: PublicPolicy;
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

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  customerName: string;
  createdAt: string;
}

export interface BusinessReviews {
  averageRating: number;
  totalReviews: number;
  reviews: {
    content: Review[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export type UserRole = "BUSINESS_OWNER" | "STAFF" | "PLATFORM_ADMIN";

export interface AccountProfile {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

/** Platform back office (role PLATFORM_ADMIN). "Last 30 days" counts records created in the 30 days before the request. */
export interface PlatformOverview {
  totalBusinesses: number;
  activeBusinesses: number;
  /** Waiting for approval. */
  pendingBusinesses: number;
  suspendedBusinesses: number;
  newBusinessesLast30Days: number;
  /** Business owners and staff; admins are not counted. */
  totalUsers: number;
  disabledUsers: number;
  newUsersLast30Days: number;
  bookingsLast30Days: number;
}

export interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  createdAt: string;
  statusChangedAt: string | null;
  ownerId: string;
  ownerEmail: string;
  ownerActive: boolean;
  activeStaff: number;
  bookingsLast30Days: number;
}

export interface AdminBusinessDetail extends AdminBusiness {
  /** Internal note from the last reject or suspend; never shown to the business. */
  statusReason: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
  locale: string;
  ownerEmailVerified: boolean;
  activeServices: number;
  customers: number;
  totalBookings: number;
  upcomingBookings: number;
  lastBookingCreatedAt: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  businessId: string | null;
  businessName: string | null;
}

export type AdminAction =
  | "BUSINESS_APPROVED"
  | "BUSINESS_REJECTED"
  | "BUSINESS_SUSPENDED"
  | "BUSINESS_REACTIVATED"
  | "USER_DISABLED"
  | "USER_ENABLED";
export type AuditTargetType = "BUSINESS" | "USER";

export interface AuditEntry {
  id: string;
  action: AdminAction;
  targetType: AuditTargetType;
  targetId: string;
  /** Current business name or account email; null once the target was deleted. */
  targetLabel: string | null;
  actorId: string | null;
  actorEmail: string | null;
  reason: string | null;
  createdAt: string;
}
