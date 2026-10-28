import type { MouseEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HeaderActions } from './HeaderActions'

export interface NavItem {
  label: string
  href: string
  isActive?: boolean
}

export interface UserProfile {
  name: string
  avatarUrl?: string | null
  initials?: string
}

export interface HeaderProps {
  logo: ReactNode
  brandName: string
  onBrandClick?: () => void

  navItems?: NavItem[]
  onNavItemClick?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void

  user?: UserProfile | null
  onCreateEvent?: () => void
  onNotificationClick?: () => void
  notificationsBadge?: string | null
  isUserMenuOpen?: boolean
  onUserMenuToggle?: () => void

  onLoginClick?: () => void
  onRegisterClick?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onLogoutClick?: () => void
  className?: string
}

export function Header({
  logo,
  brandName,
  onBrandClick,
  navItems = [],
  onNavItemClick,
  user = null,
  onCreateEvent,
  onNotificationClick,
  notificationsBadge = null,
  isUserMenuOpen = false,
  onUserMenuToggle,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className,
      )}
    >
      <div className="flex h-16 w-full items-center justify-between gap-2 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onBrandClick}
          aria-label={brandName}
          className="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground [&_img]:size-6 [&_svg]:size-6">
            {logo}
          </span>
          <span className="hidden text-base font-bold tracking-tight text-foreground sm:inline">
            {brandName}
          </span>
        </button>

        <nav aria-label="Main" className="ml-8 hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.isActive ? 'page' : undefined}
              onClick={(event) => onNavItemClick?.(event, item.href)}
              className={cn(
                'text-[13px] font-medium whitespace-nowrap transition-colors',
                item.isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <HeaderActions
          user={user}
          onCreateEvent={onCreateEvent}
          onNotificationClick={onNotificationClick}
          notificationsBadge={notificationsBadge}
          isUserMenuOpen={isUserMenuOpen}
          onUserMenuToggle={onUserMenuToggle}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
          onLogoutClick={onLogoutClick}
        />
      </div>
    </header>
  )
} 