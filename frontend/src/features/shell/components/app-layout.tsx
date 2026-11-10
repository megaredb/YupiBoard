import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppToaster } from "@/shared/components/app-toaster";
import { OfflineBanner } from "@/shared/components/offline-banner";
import { Footer } from "@/shared/layout/footer";
import { cn } from "@/shared/lib/cn";
import { useCurrentUser } from "@/features/auth";
import { AppHeader } from "@/features/shell/components/app-header";
import { MobileTabBar } from "@/features/shell/components/mobile-tab-bar";
import { useDocumentTitle } from "@/features/shell/hooks/use-document-title";
import { useRouteStaticData } from "@/features/shell/hooks/use-route-static-data";

export function AppLayout() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { layout, titleKey } = useRouteStaticData();
  useDocumentTitle(titleKey);
  const hasChrome = layout !== "standalone";
  // Immersive pages bring their own phone bottom bar (e.g. booking on the event page).
  const hasTabBar = user !== null && layout === "default";

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col bg-background text-foreground",
        hasTabBar && "max-desktop:with-tab-bar",
        // A fixed phone action bar (booking on the event page) reserves its own space.
        "max-desktop:has-data-[slot=action-bar]:with-action-bar",
      )}
    >
      {hasChrome && (
        <AppHeader className={layout === "immersive" ? "max-desktop:hidden" : undefined} />
      )}
      <OfflineBanner />
      <main className="w-full flex-1 pb-bottom-bar">
        <Outlet />
      </main>
      {hasChrome && <Footer className="max-desktop:hidden" copyright={t("shell.copyright")} />}
      {hasTabBar && <MobileTabBar />}
      <AppToaster />
    </div>
  );
}
