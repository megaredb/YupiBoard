import { useEffect, useState } from "react"
import { Outlet, useLocation, useMatches, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { getInitials } from "@/lib/format"
import { useAuthStore } from "@/stores/auth"
import { Footer } from "./Footer"
import { Header, type NavItem, type UserProfile } from "./Header"
import { MobileTopBar } from "./MobileNav"

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

  // Outside click and Escape close the menu.
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
    { label: t("nav.events"), href: "/events", isActive: pathname.startsWith("/events") },
  ]

  const handleLogout = async () => {
    await logout()
    void navigate({ to: "/events" })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header
        className="hidden md:block"
        logo={LOGO}
        brandName={t("layout.brand")}
        onBrandClick={() => void navigate({ to: "/events" })}
        navItems={navItems}
        onNavItemClick={(event) => {
          event.preventDefault()
          void navigate({ to: "/events" })
        }}
        user={user}
        onCreateEvent={() => void navigate({ to: "/events/new" })}
        isUserMenuOpen={isUserMenuOpen}
        onUserMenuToggle={() => setMenuOpenedAt(isUserMenuOpen ? null : pathname)}
        onLoginClick={() => void navigate({ to: "/login" })}
        onRegisterClick={() => void navigate({ to: "/register" })}
        onLogoutClick={() => void handleLogout()}
      />

      {!hideMobileChrome && <MobileTopBar className="md:hidden" logo={LOGO} brandName={t("layout.brand")} />}

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer className="hidden md:block" copyright={t("layout.copyright")} />
    </div>
  )
}
