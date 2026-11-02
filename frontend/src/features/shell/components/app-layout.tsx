import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { OfflineBanner } from "@/shared/components/offline-banner";
import { Toaster } from "@/shared/components/toaster";
import { cn } from "@/shared/lib/cn";
import { Footer } from "@/shared/layout/footer";
import { useCurrentUser } from "@/features/auth";
import { AppHeader } from "@/features/shell/components/app-header";
import { MobileTabBar } from "@/features/shell/components/mobile-tab-bar";
import { useDocumentTitle } from "@/features/shell/hooks/use-document-title";
import { useRouteStaticData } from "@/features/shell/hooks/use-route-static-data";

/** Root route component: app chrome around every page, chosen by the route's `layout` flag. */
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
        hasTabBar && "max-md:with-tab-bar",
      )}
    >
      {hasChrome && <AppHeader className={layout === "immersive" ? "max-lg:hidden" : undefined} />}
      <OfflineBanner />
      <main className="w-full flex-1 pb-bottom-bar">
        <Outlet />
      </main>
      {hasChrome && (
        <Footer
          className="max-md:hidden"
          brandName={t("common.brand")}
          copyright={t("shell.copyright")}
        />
      )}
      {hasTabBar && <MobileTabBar />}
      <Toaster />
    </div>
  );
}
