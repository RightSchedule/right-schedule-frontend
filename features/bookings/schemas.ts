import { z } from "zod";
import enPublic from "@/messages/en/public.json";

const PHONE_PATTERN = /^[+\d][\d\s()-]{5,}$/;

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
    name: z.string().trim().min(2, t("nameRequired")),
    phone: z.string().trim().regex(PHONE_PATTERN, t("phoneInvalid")),
    email: z.email(t("emailInvalid")),
    notes: z.string().max(1000).optional(),
  });
}

/** Staff-entered booking: the backend only needs one way to reach the customer. */
export function makeStaffCustomerSchema(t: ValidationTranslator) {
  return z
    .object({
      name: z.string().trim().min(1, t("customerNameRequired")).max(255),
      phone: z.union([
        z.literal(""),
        z.string().trim().regex(PHONE_PATTERN, t("phoneInvalid")),
      ]),
      email: z.union([z.literal(""), z.email(t("emailInvalid"))]),
      notes: z.string().max(1000).optional(),
    })
    .refine((v) => v.phone.trim() !== "" || v.email !== "", {
      path: ["phone"],
      message: t("contactRequired"),
    });
}
