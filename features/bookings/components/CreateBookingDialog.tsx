"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FormError, LoadingButton } from "@/components/shared";
import { CustomerFields } from "@/features/bookings/components/CustomerFields";
import { useCreatePublicBooking } from "@/features/bookings/hooks/useCreatePublicBooking";
import { makeStaffCustomerSchema, type CustomerValues } from "@/features/bookings/schemas";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useServices } from "@/features/services/hooks/useServices";
import { useStaff, useStaffServices } from "@/features/staff/hooks/useStaff";

export interface BookingDraft {
  date: string;
  time: string;
  staffId?: string;
}

function CreateBookingForm({
  draft,
  onDone,
}: {
  draft: BookingDraft;
  onDone: () => void;
}) {
  const t = useTranslations("calendar.create");
  const tCommon = useTranslations("common.actions");
  const tValidation = useTranslations("public.validation");
  const customerSchema = useMemo(() => makeStaffCustomerSchema(tValidation), [tValidation]);
  const uiLocale = useLocale();
  const toast = useToast();
  const business = useBusiness().data;
  const allStaff = useStaff().data;
  const allServices = useServices().data;
  const create = useCreatePublicBooking({ asOwner: true });

  const [date, setDate] = useState(draft.date);
  const [time, setTime] = useState(draft.time);
  const [staffChoice, setStaffChoice] = useState(draft.staffId ?? "");
  const [serviceChoice, setServiceChoice] = useState("");

  const activeStaff = (allStaff ?? []).filter((s) => s.active || s.id === draft.staffId);
  const staffId = staffChoice || activeStaff[0]?.id || "";
  const offeredIds = useStaffServices(staffId).data;
  const offered = (allServices ?? []).filter((s) => s.active && offeredIds?.includes(s.id));
  const serviceId = offered.some((s) => s.id === serviceChoice) ? serviceChoice : (offered[0]?.id ?? "");

  const selectedService = offered.find((s) => s.id === serviceId);
  const maxParty = selectedService?.maxPartySize ?? business?.defaultMaxPartySize ?? 1;
  const [partyChoice, setPartyChoice] = useState(1);
  const partySize = Math.min(partyChoice, maxParty);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  const ready = !!business && !!staffId && !!serviceId && !!date && !!time;

  async function onSubmit(values: CustomerValues) {
    if (!business || !ready) return;
    const booking = await create.submit({
      businessId: business.id,
      serviceId,
      staffId,
      date,
      time,
      partySize,
      customer: {
        name: values.name,
        phone: values.phone.trim() || undefined,
        email: values.email || undefined,
      },
      notes: values.notes?.trim() || undefined,
      locale: business.locale ?? uiLocale,
    });
    if (!booking) return;
    toast.success(t("created"));
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("date")} htmlFor="nb-date">
          <Input id="nb-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("time")} htmlFor="nb-time">
          <Input id="nb-time" type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label={t("professional")} htmlFor="nb-staff">
        <Select id="nb-staff" value={staffId} onChange={(e) => setStaffChoice(e.target.value)}>
          {activeStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={t("service")}
        htmlFor="nb-service"
        error={staffId && offeredIds && offered.length === 0 ? t("noServices") : undefined}
      >
        <Select id="nb-service" value={serviceId} onChange={(e) => setServiceChoice(e.target.value)}>
          {offered.map((s) => (
            <option key={s.id} value={s.id}>
              {t("serviceOption", { name: s.name, minutes: s.durationMinutes })}
            </option>
          ))}
        </Select>
      </Field>
      {maxParty > 1 && selectedService && (
        <Field label={t("people")} htmlFor="nb-party">
          <Select
            id="nb-party"
            value={partySize}
            onChange={(e) => setPartyChoice(Number(e.target.value))}
          >
            {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {t("peopleOption", { count: n, minutes: selectedService.durationMinutes * n })}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <CustomerFields
        register={register}
        errors={errors}
        idPrefix="nb"
        nameLabel={t("customerName")}
        contactOptional
        showNotes
      />

      <FormError message={create.error} />
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {tCommon("cancel")}
        </Button>
        <LoadingButton type="submit" loading={create.isPending} disabled={!ready}>
          {t("submit")}
        </LoadingButton>
      </div>
    </form>
  );
}

export function CreateBookingDialog({
  draft,
  onOpenChange,
}: {
  draft: BookingDraft | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("calendar.create");
  return (
    <Dialog open={!!draft} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {draft && (
          <CreateBookingForm
            key={`${draft.date}|${draft.time}|${draft.staffId ?? ""}`}
            draft={draft}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
