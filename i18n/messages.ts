import enAuth from "@/messages/en/auth.json";
import enCalendar from "@/messages/en/calendar.json";
import enCommon from "@/messages/en/common.json";
import enCustomers from "@/messages/en/customers.json";
import enDashboard from "@/messages/en/dashboard.json";
import enErrors from "@/messages/en/errors.json";
import enOnboarding from "@/messages/en/onboarding.json";
import enPublic from "@/messages/en/public.json";
import enQuotes from "@/messages/en/quotes.json";
import enServices from "@/messages/en/services.json";
import enSettings from "@/messages/en/settings.json";
import enStaff from "@/messages/en/staff.json";
import ptAuth from "@/messages/pt/auth.json";
import ptCalendar from "@/messages/pt/calendar.json";
import ptCommon from "@/messages/pt/common.json";
import ptCustomers from "@/messages/pt/customers.json";
import ptDashboard from "@/messages/pt/dashboard.json";
import ptErrors from "@/messages/pt/errors.json";
import ptOnboarding from "@/messages/pt/onboarding.json";
import ptPublic from "@/messages/pt/public.json";
import ptQuotes from "@/messages/pt/quotes.json";
import ptServices from "@/messages/pt/services.json";
import ptSettings from "@/messages/pt/settings.json";
import ptStaff from "@/messages/pt/staff.json";
import type { AppLocale } from "./config";

// One file per feature namespace (messages/<locale>/<namespace>.json) keeps diffs small.
const en = {
  auth: enAuth,
  calendar: enCalendar,
  common: enCommon,
  customers: enCustomers,
  dashboard: enDashboard,
  errors: enErrors,
  onboarding: enOnboarding,
  public: enPublic,
  quotes: enQuotes,
  services: enServices,
  settings: enSettings,
  staff: enStaff,
};

const pt: Messages = {
  auth: ptAuth,
  calendar: ptCalendar,
  common: ptCommon,
  customers: ptCustomers,
  dashboard: ptDashboard,
  errors: ptErrors,
  onboarding: ptOnboarding,
  public: ptPublic,
  quotes: ptQuotes,
  services: ptServices,
  settings: ptSettings,
  staff: ptStaff,
};

export type Messages = typeof en;

export const messages: Record<AppLocale, Messages> = { en, pt };
