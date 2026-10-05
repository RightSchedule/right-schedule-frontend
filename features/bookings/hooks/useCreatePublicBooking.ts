"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { bookingsApi } from "@/lib/api/bookings";
import { isStatus } from "@/lib/api/client";
import { useErrorMessage } from "@/lib/i18n/errors";
import { toStartDateTime } from "@/lib/utils/date";
import { qk } from "@/lib/query/keys";
import type { Booking } from "@/types/domain";

export interface NewBookingInput {
  businessId: string;
  serviceId: string;
  staffId?: string | null;
  date: string;
  time: string;
  customer: { name: string; phone?: string; email?: string };
  notes?: string;
  partySize?: number;
  /** Customer's language for emails; defaults to the active UI locale. */
  locale?: string;
}

/**
 * Creates a booking through the public endpoint. The Idempotency-Key is reused
 * while the payload is unchanged, so retries and double-submits never duplicate.
 * `error` is a translated message derived from the raw failure at render time, so it
 * follows the active language.
 */
export function useCreatePublicBooking() {
  const qc = useQueryClient();
  const activeLocale = useLocale();
  const tErrors = useTranslations("errors");
  const tPublic = useTranslations("public");
  const errorMessage = useErrorMessage();
  const keyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  const [conflict, setConflict] = useState(false);
  const [isPending, setPending] = useState(false);

  async function submit(input: NewBookingInput): Promise<Booking | null> {
    const payload = {
      businessId: input.businessId,
      serviceId: input.serviceId,
      staffId: input.staffId ?? undefined,
      startDateTime: toStartDateTime(input.date, input.time),
      customer: input.customer,
      notes: input.notes || undefined,
      partySize: input.partySize && input.partySize > 1 ? input.partySize : undefined,
      locale: input.locale ?? activeLocale,
    };
    const fingerprint = JSON.stringify(payload);
    if (keyRef.current?.fingerprint !== fingerprint) {
      keyRef.current = { fingerprint, key: crypto.randomUUID() };
    }

    setFailure(null);
    setConflict(false);
    setPending(true);
    try {
      const booking = await bookingsApi.createPublic(payload, keyRef.current.key);
      keyRef.current = null;
      qc.invalidateQueries({ queryKey: qk.bookings.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.public.availabilityAll });
      return booking;
    } catch (e) {
      if (isStatus(e, 409)) {
        setConflict(true);
        qc.invalidateQueries({ queryKey: qk.public.availabilityAll });
      } else if (isStatus(e, 422)) {
        keyRef.current = null;
      }
      setFailure(e);
      return null;
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setFailure(null);
    setConflict(false);
  }

  const error =
    failure === null
      ? null
      : errorMessage(failure, {
          overrides: {
            409: tErrors("codes.SLOT_UNAVAILABLE"),
            404: tPublic("wizard.errors.unavailable"),
          },
        });

  return { submit, isPending, error, conflict, reset };
}
