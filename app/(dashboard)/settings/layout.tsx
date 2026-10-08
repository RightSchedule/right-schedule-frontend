import { SettingsShell } from "@/features/business/components/SettingsShell";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
