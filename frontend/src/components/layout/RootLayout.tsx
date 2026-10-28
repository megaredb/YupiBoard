import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router"
import { CheckCircle2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Header, type NavItem, type UserProfile } from "@/components/ui/header"
import { useAuthStore } from "@/stores/auth"

const STANDALONE_PATHS = new Set([
  "/login",
  "/register",
  "/profile/complete",
  "/component-preview",
])

function getUserInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
  fallback = "—"
): string {
  const f = firstName?.trim()?.[0] ?? ""
  const l = lastName?.trim()?.[0] ?? ""
  if (f || l) return `${f}${l}`.toUpperCase()
  return (email?.trim()?.[0] ?? fallback).toUpperCase()
}

export function RootLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const logoutNotice = useAuthStore((state) => state.logoutNotice)
  const clearLogoutNotice = useAuthStore((state) => state.clearLogoutNotice)
  const sessionExpired = useAuthStore((state) => state.sessionExpired)
  const clearSessionExpired = useAuthStore((state) => state.clearSessionExpired)

  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // SRS 3.2.2.5: Session already expired -> redirect to sign-in page without an error.
  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpired()
      void navigate({ to: "/login", replace: true })
    }
  }, [sessionExpired, clearSessionExpired, navigate])

  const isStandalone = STANDALONE_PATHS.has(location.pathname)
  const dash = t("profile.notProvided")

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email ||
    dash

  const headerUser: UserProfile | null = user
    ? {
        name: displayName,
        avatarUrl: user.avatar_url,
        initials: getUserInitials(
          user.first_name,
          user.last_name,
          user.email,
          dash
        ),
      }
    : null

  const navItems: NavItem[] = user
    ? [
        {
          label: t("nav.events"),
          href: "/",
          isActive: location.pathname === "/",
        },
        {
          label: t("nav.myEvents"),
          href: "/my-events",
          isActive: location.pathname === "/my-events",
        },
        {
          label: t("nav.myBookings"),
          href: "/my-bookings",
          isActive: location.pathname === "/my-bookings",
        },
        {
          label: t("nav.favorite"),
          href: "/favorite",
          isActive: location.pathname === "/favorite",
        },
      ]
    : [
        {
          label: t("nav.events"),
          href: "/",
          isActive: location.pathname === "/",
        },
      ]

  const handleLogout = async () => {
    setIsUserMenuOpen(false)
    await logout()
    void navigate({ to: "/" })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isStandalone && (
        <Header
          logo={<img src="/images/logo.svg" alt="" />}
          brandName={t("common.brand")}
          onBrandClick={() => {
            setIsNavOpen(false)
            setIsUserMenuOpen(false)
            void navigate({ to: "/" })
          }}
          navItems={navItems}
          onNavItemClick={(event) => {
            event.preventDefault()
            setIsNavOpen(false)
            void navigate({ to: "/" })
          }}
          isNavOpen={isNavOpen}
          onNavToggle={() => setIsNavOpen((prev) => !prev)}
          user={headerUser}
          isUserMenuOpen={isUserMenuOpen}
          onUserMenuToggle={() => setIsUserMenuOpen((prev) => !prev)}
          onLoginClick={() => void navigate({ to: "/login" })}
          onRegisterClick={() => void navigate({ to: "/register" })}
          onProfileClick={() => {
            setIsUserMenuOpen(false)
            void navigate({ to: "/profile" })
          }}
          onSettingsClick={() => {
            setIsUserMenuOpen(false)
            if (user?.id) {
              void navigate({
                to: "/users/$userId",
                params: { userId: user.id },
              })
            }
          }}
          onLogoutClick={() => void handleLogout()}
        />
      )}

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
