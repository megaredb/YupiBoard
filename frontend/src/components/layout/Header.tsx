import type { MouseEvent, ReactNode } from 'react'
import {
  Bell,
  LogOut,
  Menu,
  Plus,
  Settings,
  User as UserIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
  isNavOpen?: boolean
  onNavToggle?: () => void

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

const menuPanelClass =
  'absolute top-full z-50 mt-2 min-w-44 rounded-md border border-border bg-background p-1 text-sm shadow-md'
const menuItemClass =
  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none [&_svg]:size-4'

export function Header({
  logo,
  brandName,
  onBrandClick,
  navItems = [],
  onNavItemClick,
  isNavOpen = false,
  onNavToggle,
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
      <div className="flex h-12 w-full items-center justify-between gap-2 px-4 sm:px-6">
        {navItems.length > 0 && (
          <div className="relative md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label="Open navigation"
              aria-expanded={isNavOpen}
              onClick={onNavToggle}
            >
              <Menu className="size-5 text-muted-foreground" />
            </Button>
            {isNavOpen && (
              <div className={cn(menuPanelClass, 'left-0')}>
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={item.isActive ? 'page' : undefined}
                    onClick={(event) => onNavItemClick?.(event, item.href)}
                    className={cn(menuItemClass, item.isActive && 'text-primary')}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onBrandClick}
          aria-label={brandName}
          className="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="flex size-10 items-center justify-center rounded-xl [&_img]:size-7 [&_svg]:size-6">
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

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          {user ? (
            <>
              <Button
                type="button"
                onClick={onCreateEvent}
                aria-label="Create event"
                className="h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 sm:px-4"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Create event</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onNotificationClick}
                aria-label={
                  notificationsBadge
                    ? `Notifications, ${notificationsBadge} unread`
                    : 'Notifications'
                }
                className="relative rounded-full"
              >
                <Bell className="size-5 text-muted-foreground" />
                {notificationsBadge && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground">
                    {notificationsBadge}
                  </span>
                )}
              </Button>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Open user menu"
                  aria-expanded={isUserMenuOpen}
                  onClick={onUserMenuToggle}
                  className="flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    (user.initials ?? <UserIcon className="size-4" />)
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className={cn(menuPanelClass, 'right-0')}>
                    <p className="truncate px-2 py-1.5 font-medium">
                      {user.name}
                    </p>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      className={menuItemClass}
                      onClick={onProfileClick}
                    >
                      <UserIcon />
                      Profile
                    </button>
                    <button
                      type="button"
                      className={menuItemClass}
                      onClick={onSettingsClick}
                    >
                      <Settings />
                      Settings
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      className={cn(menuItemClass, 'text-destructive')}
                      onClick={onLogoutClick}
                    >
                      <LogOut />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={onLoginClick}>
                Log in
              </Button>
              <Button
                type="button"
                onClick={onRegisterClick}
                className="rounded-xl bg-primary px-5 font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 