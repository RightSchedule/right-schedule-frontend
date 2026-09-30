export interface ApiError {
  status: number;
  detail: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: string;
}

export interface AvailabilityResponse {
  date: string;
  slots: Array<{ start: string; end: string }>;
}

export type Granularity = "day" | "week" | "month";

export interface DateRangeDto {
  from: string;
  to: string;
}

export interface DashboardResponse {
  range: DateRangeDto;
  /** Same length as `range`, ends the day before `range.from`. */
  previousRange: DateRangeDto;
  /** Chosen by the server from the range length. */
  granularity: Granularity;
  summary: {
    revenue: number;
    previousRevenue: number;
    /** CONFIRMED bookings only. */
    projectedRevenue: number;
    bookings: number;
    previousBookings: number;
    completedBookings: number;
    averageTicket: number;
    /** Fraction 0..1 of all bookings. */
    cancellationRate: number;
    /** Fraction 0..1 of all bookings. */
    noShowRate: number;
  };
  /** Zero-filled: every bucket of the range is present. `bucket` is its first day (yyyy-MM-dd). */
  revenueSeries: Array<{ bucket: string; revenue: number; completedBookings: number }>;
  funnel: { confirmed: number; completed: number; cancelled: number; noShow: number };
  topServices: Array<{ serviceId: string; name: string; completedBookings: number; revenue: number }>;
  topStaff: Array<{
    staffId: string;
    name: string;
    completedBookings: number;
    revenue: number;
    completedMinutes: number;
  }>;
}
