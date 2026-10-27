import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router"
import { CheckCircle2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"

const STANDALONE_PATHS = new Set([
  "/login",
  "/register",
  "/profile/complete",
  "/component-preview",
])

export function RootLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const logoutNotice = useAuthStore((state) => state.logoutNotice)
  const clearLogoutNotice = useAuthStore((state) => state.clearLogoutNotice)
  const sessionExpired = useAuthStore((state) => state.sessionExpired)
  const clearSessionExpired = useAuthStore((state) => state.clearSessionExpired)

  // SRS 3.2.2.5: Session already expired -> redirect to sign-in page without an error.
  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpired()
      void navigate({ to: "/login", replace: true })
    }
  }, [sessionExpired, clearSessionExpired, navigate])

  const isStandalone = STANDALONE_PATHS.has(location.pathname)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isStandalone && <Navbar />}

      {logoutNotice && (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
        >
          <div className="flex w-full items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              <span>{t("nav.loggedOutMessage")}</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={clearLogoutNotice}
              aria-label={t("common.cancel")}
              className="text-success hover:bg-success/15 hover:text-success"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <main
        className={
          isStandalone
            ? "mx-auto w-full px-4"
            : "mx-auto w-full max-w-6xl pb-12"
        }
      >
        <Outlet />
      </main>
    </div>
  )
}

