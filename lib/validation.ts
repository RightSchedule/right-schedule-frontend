import { z } from "zod";

export const LIMITS = {
  name: 255,
  email: 255,
  phone: 50,
  notes: 1000,
  description: 1000,
  quoteMessage: 2000,
  address: 255,
  passwordMin: 8,
  passwordMax: 72,
  partySize: 10,
} as const;

export const PHONE_PATTERN = /^[+\d][\d\s()-]{5,}$/;

export const requiredName = (message: string, min = 1) =>
  z.string().trim().min(min, message).max(LIMITS.name);

export const requiredEmail = (message: string) =>
  z.email(message).max(LIMITS.email);

export const optionalEmail = (message: string) =>
  z.union([z.literal(""), requiredEmail(message)]);

export const requiredPhone = (message: string) =>
  z.string().trim().regex(PHONE_PATTERN, message).max(LIMITS.phone);

export const optionalPhone = (message: string) =>
  z.union([z.literal(""), requiredPhone(message)]);

export const newPassword = (messages: { min: string; max: string }) =>
  z.string().min(LIMITS.passwordMin, messages.min).max(LIMITS.passwordMax, messages.max);

export const optionalText = (max: number) => z.string().max(max).optional();

export const hasContact = (v: { phone: string; email: string }) =>
  v.phone.trim() !== "" || v.email !== "";
