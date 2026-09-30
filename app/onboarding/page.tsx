import { Aurora } from "@/components/ui/aurora";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <main className="relative isolate flex min-h-dvh items-start justify-center bg-background px-4 py-6 sm:items-center sm:py-10">
      <Aurora className="fixed inset-0 -z-10" />
      <div className="w-full max-w-xl">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <OnboardingWizard />
      </div>
    </main>
  );
}
