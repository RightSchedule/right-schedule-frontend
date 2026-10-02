import { z } from "zod";
import enPublic from "@/messages/en/public.json";
import {
  LIMITS,
  hasContact,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredEmail,
  requiredName,
  requiredPhone,
} from "@/lib/validation";

export interface CustomerValues {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

/** Translator scoped to `public.validation`: `useTranslations("public.validation")`. */
export type ValidationTranslator = (key: keyof typeof enPublic.validation) => string;

/** Customer-facing booking form: name, phone and email are all required. */
export function makePublicCustomerSchema(t: ValidationTranslator) {
  return z.object({
    name: requiredName(t("nameRequired"), 2),
    phone: requiredPhone(t("phoneInvalid")),
    email: requiredEmail(t("emailInvalid")),
    notes: optionalText(LIMITS.notes),
  });
}

/** Staff-entered booking: the backend only needs one way to reach the customer. */
export function makeStaffCustomerSchema(t: ValidationTranslator) {
  return z
    .object({
      name: requiredName(t("customerNameRequired")),
      phone: optionalPhone(t("phoneInvalid")),
      email: optionalEmail(t("emailInvalid")),
      notes: optionalText(LIMITS.notes),
    })
    .refine(hasContact, {
      path: ["phone"],
      message: t("contactRequired"),
    });
}
