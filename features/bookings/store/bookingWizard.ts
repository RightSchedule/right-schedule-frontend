import type { BookingWizardState } from "@/types/ui";

export const WIZARD_STEPS = ["service", "party", "staff", "when", "details"] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export const initialWizardState: BookingWizardState = {
  serviceId: null,
  partySize: 1,
  staffId: null,
  date: null,
  startTime: null,
};

export type WizardAction =
  | { type: "SET_SERVICE"; serviceId: string }
  | { type: "SET_PARTY_SIZE"; partySize: number }
  | { type: "SET_STAFF"; staffId: string | null }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_TIME"; startTime: string }
;

export function wizardReducer(
  state: BookingWizardState,
  action: WizardAction
): BookingWizardState {
  switch (action.type) {
    case "SET_SERVICE":
      return { ...initialWizardState, serviceId: action.serviceId };
    case "SET_PARTY_SIZE":
      return { ...state, partySize: action.partySize, date: null, startTime: null };
    case "SET_STAFF":
      return { ...state, staffId: action.staffId, date: null, startTime: null };
    case "SET_DATE":
      return { ...state, date: action.date, startTime: null };
    case "SET_TIME":
      return { ...state, startTime: action.startTime };
  }
}
