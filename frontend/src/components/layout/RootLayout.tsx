import { useEffect, useState } from "react"
import { Outlet, useLocation, useMatches, useNavigate } from "@tanstack/react-router"
import { CheckCircle2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/ui/footer"
import { Header, type NavItem, type UserProfile } from "@/components/ui/header"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { useAuthStore } from "@/stores/auth"

const STANDALONE_PATHS = new Set([
  "/login",
  "/register",
  "/profile/complete",
  "/events/new",
])

const LOGO = <BrandLogo variant="icon-only" size="md" />

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
  const hideMobileChrome = useMatches({
    select: (matches) =>
      matches.some((match) => Boolean((match.staticData as { hideMobileChrome?: boolean })?.hideMobileChrome)),
  })

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const logoutNotice = useAuthStore((state) => state.logoutNotice)
  const clearLogoutNotice = useAuthStore((state) => state.clearLogoutNotice)
  const sessionExpired = useAuthStore((state) => state.sessionExpired)
  const clearSessionExpired = useAuthStore((state) => state.clearSessionExpired)

  const [isNavOpen, setIsNavOpen] = useState(false)
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null)
  const isUserMenuOpen = menuOpenedAt === location.pathname

  // SRS 3.2.2.5: Session already expired -> redirect to sign-in page without an error.
  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpired()
      void navigate({ to: "/login", replace: true })
    }
  }, [sessionExpired, clearSessionExpired, navigate])

  useEffect(() => {
    if (!isUserMenuOpen && !isNavOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest("header")) {
        setMenuOpenedAt(null)
        setIsNavOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpenedAt(null)
        setIsNavOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isUserMenuOpen, isNavOpen])

  const pathname = location.pathname
  const isStandalone = STANDALONE_PATHS.has(pathname)
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

  const isEventsActive =
    pathname === "/" ||
    pathname === "/events" ||
    (pathname.startsWith("/events/") && pathname !== "/events/new")

  const navItems: NavItem[] = [
    {
      label: t("nav.events"),
      href: "/events",
      isActive: isEventsActive,
    },
    {
      label: t("nav.myEvents"),
      href: "/my-events",
      isActive: pathname === "/my-events",
    },
    {
      label: t("nav.myBookings"),
      href: "/my-bookings",
      isActive: pathname === "/my-bookings",
    },
    {
      label: t("nav.favorites"),
      href: "/favorites",
      isActive: pathname === "/favorites",
    },
  ]

  const navigateTo = (href: string) => {
    setIsNavOpen(false)
    setMenuOpenedAt(null)
    switch (href) {
      case "/":
        void navigate({ to: "/" })
        break
      case "/events":
        void navigate({ to: "/events" })
        break
      case "/events/new":
        void navigate({ to: "/events/new" })
        break
      case "/my-events":
        void navigate({ to: "/my-events" })
        break
      case "/my-bookings":
        void navigate({ to: "/my-bookings" })
        break
      case "/favorites":
        void navigate({ to: "/favorites" })
        break
    }
  }

  const handleLogout = async () => {
    setMenuOpenedAt(null)
    await logout()
    void navigate({ to: "/events" })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {!isStandalone && (
        <Header
          className={hideMobileChrome ? "max-lg:hidden" : undefined}
          logo={LOGO}
          brandName={t("common.brand")}
          onBrandClick={() => navigateTo("/events")}
          navItems={navItems}
          onNavItemClick={(event, href) => {
            event.preventDefault()
            navigateTo(href)
          }}
          isNavOpen={isNavOpen}
          onNavToggle={() => setIsNavOpen((prev) => !prev)}
          user={headerUser}
          onCreateEvent={() => navigateTo("/events/new")}
          isUserMenuOpen={isUserMenuOpen}
          onUserMenuToggle={() => setMenuOpenedAt(isUserMenuOpen ? null : pathname)}
          onLoginClick={() => void navigate({ to: "/login" })}
          onRegisterClick={() => void navigate({ to: "/register" })}
          onProfileClick={() => {
            setMenuOpenedAt(null)
            void navigate({ to: "/profile" })
          }}
          onSettingsClick={() => {
            setMenuOpenedAt(null)
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
          className="mx-auto mt-4 flex w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
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

      <main className={isStandalone ? "mx-auto w-full flex-1 px-4" : "w-full flex-1"}>
        <Outlet />
      </main>

      {!isStandalone && (
        <Footer
          brandName={t("layout.brand")}
          copyright={t("layout.copyright")}
        />
      )}
    </div>
  )
}
