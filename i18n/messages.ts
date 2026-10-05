import enAnalytics from "@/messages/en/analytics.json";
import enAuth from "@/messages/en/auth.json";
import enCalendar from "@/messages/en/calendar.json";
import enCommon from "@/messages/en/common.json";
import enCustomers from "@/messages/en/customers.json";
import enDashboard from "@/messages/en/dashboard.json";
import enErrors from "@/messages/en/errors.json";
import enLegal from "@/messages/en/legal.json";
import enOnboarding from "@/messages/en/onboarding.json";
import enPublic from "@/messages/en/public.json";
import enQuotes from "@/messages/en/quotes.json";
import enReview from "@/messages/en/review.json";
import enServices from "@/messages/en/services.json";
import enSettings from "@/messages/en/settings.json";
import enStaff from "@/messages/en/staff.json";
import enWaitlist from "@/messages/en/waitlist.json";
import ptAnalytics from "@/messages/pt/analytics.json";
import ptAuth from "@/messages/pt/auth.json";
import ptCalendar from "@/messages/pt/calendar.json";
import ptCommon from "@/messages/pt/common.json";
import ptCustomers from "@/messages/pt/customers.json";
import ptDashboard from "@/messages/pt/dashboard.json";
import ptErrors from "@/messages/pt/errors.json";
import ptLegal from "@/messages/pt/legal.json";
import ptOnboarding from "@/messages/pt/onboarding.json";
import ptPublic from "@/messages/pt/public.json";
import ptQuotes from "@/messages/pt/quotes.json";
import ptReview from "@/messages/pt/review.json";
import ptServices from "@/messages/pt/services.json";
import ptSettings from "@/messages/pt/settings.json";
import ptStaff from "@/messages/pt/staff.json";
import ptWaitlist from "@/messages/pt/waitlist.json";
import type { AppLocale } from "./config";

// One file per feature namespace (messages/<locale>/<namespace>.json) keeps diffs small.
const en = {
  analytics: enAnalytics,
  auth: enAuth,
  calendar: enCalendar,
  common: enCommon,
  customers: enCustomers,
  dashboard: enDashboard,
  errors: enErrors,
  legal: enLegal,
  onboarding: enOnboarding,
  public: enPublic,
  quotes: enQuotes,
  review: enReview,
  services: enServices,
  settings: enSettings,
  staff: enStaff,
  waitlist: enWaitlist,
};

const pt: Messages = {
  analytics: ptAnalytics,
  auth: ptAuth,
  calendar: ptCalendar,
  common: ptCommon,
  customers: ptCustomers,
  dashboard: ptDashboard,
  errors: ptErrors,
  legal: ptLegal,
  onboarding: ptOnboarding,
  public: ptPublic,
  quotes: ptQuotes,
  review: ptReview,
  services: ptServices,
  settings: ptSettings,
  staff: ptStaff,
  waitlist: ptWaitlist,
};

export type Messages = typeof en;

export const messages: Record<AppLocale, Messages> = { en, pt };
