import { Link } from "@tanstack/react-router"
import { BrandLogo } from "@/shared/layout/brand-logo"
import { Header } from "@/shared/layout/header"
import { HeaderActions } from "@/features/shell/components/header-actions"
import { MainNav } from "@/features/shell/components/main-nav"
import { MobileNavMenu } from "@/features/shell/components/mobile-nav-menu"

export function AppHeader({ className }: { className?: string }) {
  return (
    <Header className={className}>
      <MobileNavMenu />
      <Link to="/events" className="flex h-11 shrink-0 items-center rounded-xl">
        <BrandLogo size="sm" className="max-sm:[&>span]:hidden" />
      </Link>
      <MainNav />
      <HeaderActions />
    </Header>
  )
}
