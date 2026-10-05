"use client";

import { ViewTransition } from "react";
import { useTranslations } from "next-intl";
import { Clock, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/components/shared";
import { ticketName } from "@/features/bookings/components/BookingTicket";
import { useLocaleFormat } from "@/lib/i18n/format";
import { transition } from "@/lib/utils/motion";
import type { PublicService, PublicStaff } from "@/types/domain";

export function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border-2 bg-card p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-accent/60" : "border-transparent hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}

export function ServiceStep({
  services,
  onSelect,
}: {
  services: PublicService[];
  onSelect: (s: PublicService) => void;
}) {
  const t = useTranslations("public");
  const { price } = useLocaleFormat();
  return (
    <ul className="flex flex-col gap-3">
      {services.map((s) => (
        <li key={s.id}>
          <ViewTransition name={ticketName(s.id)} share="vt-morph" default="none">
            <OptionCard onClick={() => onSelect(s)}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}</p>
                {s.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                )}
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> {t("service.duration", { count: s.durationMinutes })}
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-primary">{price(s.price)}</span>
            </OptionCard>
          </ViewTransition>
        </li>
      ))}
    </ul>
  );
}

export function StaffStep({
  staff,
  selectedId,
  onSelect,
}: {
  staff: PublicStaff[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const t = useTranslations("public.wizard.staff");
  return (
    <ul className="flex flex-col gap-3">
      <li>
        <OptionCard selected={selectedId === null} onClick={() => onSelect(null)}>
          <Sparkles className="size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">{t("any")}</p>
            <p className="text-sm text-muted-foreground">{t("anyHint")}</p>
          </div>
        </OptionCard>
      </li>
      {staff.map((s) => (
        <li key={s.id}>
          <OptionCard selected={selectedId === s.id} onClick={() => onSelect(s.id)}>
            <Avatar className="size-10">
              {s.photoUrl && <AvatarImage src={s.photoUrl} alt="" />}
              <AvatarFallback>{initials(s.name)}</AvatarFallback>
            </Avatar>
            <p className="font-medium">{s.name}</p>
          </OptionCard>
        </li>
      ))}
    </ul>
  );
}

export function PartyStep({
  service,
  value,
  onChange,
  onContinue,
}: {
  service: PublicService;
  value: number;
  onChange: (n: number) => void;
  onContinue: () => void;
}) {
  const t = useTranslations("public");
  const { price } = useLocaleFormat();
  const max = service.maxPartySize ?? 1;
  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label={t("wizard.party.label")} className="grid grid-cols-5 gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={n === value}
            onClick={() => onChange(n)}
            className={cn(
              "h-12 rounded-md border text-base font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              n === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {t("wizard.party.summary", {
          people: value,
          minutes: service.durationMinutes * value,
          total: price(service.price * value),
        })}
      </p>
      <Button size="lg" className="h-11 w-full text-base" onClick={onContinue}>
        {t("wizard.party.continue")}
      </Button>
    </div>
  );
}
