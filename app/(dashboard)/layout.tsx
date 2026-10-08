import { getTranslations } from "next-intl/server";
import { Sidebar, MobileBottomNav, MobileTopBar } from "@/components/layout/Sidebar";
import { AdminRedirect } from "@/features/auth/components/AdminRedirect";
import { BusinessStatusBanner } from "@/features/business/components/BusinessStatusBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common.nav");
  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="main" className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <BusinessStatusBanner />
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <AdminRedirect />
    </div>
  );
}
