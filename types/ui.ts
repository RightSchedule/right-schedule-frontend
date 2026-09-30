export interface BookingWizardState {
  serviceId: string | null;
  staffId: string | null;
  date: string | null;
  startTime: string | null;
}

export type CalendarView = "day" | "week";

export type OnboardingStep =
  | "business-name"
  | "business-type"
  | "services"
  | "staff"
  | "working-hours"
  | "done";
