import { useEffect, useState } from "react"
import { Outlet, useLocation, useMatches, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { CalendarDays, Compass, Heart, Ticket } from "lucide-react"
import { getInitials } from "@/lib/format"
import { useAuthStore } from "@/stores/auth"
import { Footer } from "./Footer"
import { BottomNav, MobileTopBar } from "./MobileNav"
import { Header, type NavItem, type UserProfile } from "./Header"

const LOGO = <img src="/images/logo.svg" alt="" />

/**
 * Shell for browsing pages: desktop header + footer, mobile top bar.
 * Add nav entries to `navItems` as new top-level pages appear.
 */
export function AppLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const hideMobileChrome = useMatches({
    select: (matches) => matches.some((match) => match.staticData.hideMobileChrome),
  })

  const authUser = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  // Remember where the menu was opened: navigating away closes it without an effect.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null)
  const isUserMenuOpen = menuOpenedAt === pathname

  useEffect(() => {
    if (!isUserMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest("header")) setMenuOpenedAt(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpenedAt(null)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isUserMenuOpen])

  const user: UserProfile | null = authUser
    ? {
        name: authUser.full_name || authUser.email,
        avatarUrl: authUser.avatar_url,
        initials: getInitials(authUser.full_name || authUser.email),
      }
    : null

  const navItems: NavItem[] = [
    { label: t("nav.events"), href: "/events", isActive: pathname === "/events" || (pathname.startsWith("/events/") && pathname !== "/events/new") },
    { label: t("nav.myEvents"), href: "/my-events", isActive: pathname === "/my-events" },
    { label: t("nav.myBookings"), href: "/my-bookings", isActive: pathname === "/my-bookings" },
    { label: t("nav.favorites"), href: "/favorites", isActive: pathname === "/favorites" },
  ]

  const navigateTo = (href: string) => {
    switch (href) {
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
    await logout()
    void navigate({ to: "/events" })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header
        className="hidden lg:block"
        logo={LOGO}
        brandName={t("layout.brand")}
        onBrandClick={() => void navigate({ to: "/events" })}
        navItems={navItems}
        onNavItemClick={(event, href) => {
          event.preventDefault()
          navigateTo(href)
        }}
        user={user}
        onCreateEvent={() => navigateTo("/events/new")}
        isUserMenuOpen={isUserMenuOpen}
        onUserMenuToggle={() => setMenuOpenedAt(isUserMenuOpen ? null : pathname)}
        onLoginClick={() => void navigate({ to: "/login" })}
        onRegisterClick={() => void navigate({ to: "/register" })}
        onLogoutClick={() => void handleLogout()}
      />

      {!hideMobileChrome && <MobileTopBar className="lg:hidden" logo={LOGO} brandName={t("layout.brand")} />}

      <main className={`flex-1 ${hideMobileChrome ? "" : "pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0"}`}>
        <Outlet />
      </main>

      {!hideMobileChrome && (
        <BottomNav
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
          items={[
            { label: t("nav.events"), icon: <Compass />, isActive: pathname === "/events", onClick: () => navigateTo("/events") },
            { label: t("nav.myEvents"), icon: <CalendarDays />, isActive: pathname === "/my-events", onClick: () => navigateTo("/my-events") },
            { label: t("nav.myBookings"), icon: <Ticket />, isActive: pathname === "/my-bookings", onClick: () => navigateTo("/my-bookings") },
            { label: t("nav.favorites"), icon: <Heart />, isActive: pathname === "/favorites", onClick: () => navigateTo("/favorites") },
          ]}
        />
      )}

      <Footer className="hidden lg:block" brandName={t("layout.brand")} copyright={t("layout.copyright")} />
    </div>
  )
}
