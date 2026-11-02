import { Outlet } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { OfflineBanner } from "@/shared/components/offline-banner"
import { Toaster } from "@/shared/components/toaster"
import { Footer } from "@/shared/layout/footer"
import { AppHeader } from "@/features/shell/components/app-header"
import { useDocumentTitle } from "@/features/shell/hooks/use-document-title"
import { useRouteStaticData } from "@/features/shell/hooks/use-route-static-data"

/** Root route component: app chrome around every page, chosen by the route's `layout` flag. */
export function AppLayout() {
  const { t } = useTranslation()
  const { layout, titleKey } = useRouteStaticData()
  useDocumentTitle(titleKey)
  const hasChrome = layout !== "standalone"

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {hasChrome && <AppHeader className={layout === "immersive" ? "max-lg:hidden" : undefined} />}
      <OfflineBanner />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      {hasChrome && <Footer brandName={t("common.brand")} copyright={t("shell.copyright")} />}
      <Toaster />
    </div>
  )
}
