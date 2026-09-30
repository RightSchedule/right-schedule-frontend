export interface BookingSummary {
  id: string;
  businessName: string;
  serviceId?: string;
  serviceName: string;
  /** null = "any professional"; the UI localizes the label at render time. */
  staffName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  customerName: string;
  customerEmail: string;
}

const key = (id: string) => `booking-summary:${id}`;

export function saveBookingSummary(summary: BookingSummary): void {
  try {
    sessionStorage.setItem(key(summary.id), JSON.stringify(summary));
  } catch {
    // storage unavailable (private mode); the confirmation page degrades gracefully
  }
}

export function loadRawBookingSummary(id: string): string | null {
  try {
    return sessionStorage.getItem(key(id));
  } catch {
    return null;
  }
}

export function parseBookingSummary(raw: string | null): BookingSummary | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingSummary;
  } catch {
    return null;
  }
}
