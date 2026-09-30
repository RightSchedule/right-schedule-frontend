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
  /** Language of emails sent to the customer ("en" | "pt"). */
  locale?: string;
  service?: Service;
  staff?: Pick<Staff, "id" | "name">;
  customer?: Customer;
}

export type QuoteStatus = "PENDING" | "QUOTED" | "DECLINED";

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
}

export type PublicService = Pick<
  Service,
  "id" | "name" | "description" | "durationMinutes" | "price"
>;

export interface PublicStaff {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface PublicBusiness
  extends Pick<Business, "id" | "slug" | "name" | "email" | "phone" | "address" | "timezone" | "locale" | "logoUrl"> {
  services: PublicService[];
}
