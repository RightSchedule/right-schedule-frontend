// Bump TERMS_VERSION whenever Terms/Privacy/DPA change materially; it is stored with each acceptance.
export const TERMS_VERSION = "2026-09-30";
export const LEGAL_UPDATED = "2026-09-30";

// TODO(legal): replace placeholders with the real entity details before launch.
export const LEGAL_ENTITY = {
  name: "[Company legal name]",
  address: "[Registered address, Portugal]",
  taxId: "[NIF / VAT number]",
  privacyEmail: "privacy@rightschedule.example",
  supportEmail: "support@rightschedule.example",
};

export const SUB_PROCESSORS: ReadonlyArray<{
  purpose: { en: string; pt: string };
  provider: string;
  region: string;
  transfer: { en: string; pt: string };
}> = [
  {
    purpose: { en: "Application hosting", pt: "Alojamento da aplicação" },
    provider: "[Hosting provider]",
    region: "[EU region]",
    transfer: { en: "Within the EEA", pt: "Dentro do EEE" },
  },
  {
    purpose: { en: "Database", pt: "Base de dados" },
    provider: "[Database provider]",
    region: "[EU region]",
    transfer: { en: "Within the EEA", pt: "Dentro do EEE" },
  },
  {
    purpose: { en: "Transactional email (SMTP)", pt: "Email transacional (SMTP)" },
    provider: "[SMTP provider]",
    region: "[Region]",
    transfer: {
      en: "[EEA, or SCCs / EU-US Data Privacy Framework]",
      pt: "[EEE, ou CCT / Quadro de Privacidade de Dados UE-EUA]",
    },
  },
];
