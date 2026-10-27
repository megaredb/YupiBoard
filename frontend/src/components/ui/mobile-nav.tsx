import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'

import { cn } from '../../lib/utils'

export interface MobileTopBarProps {
  logo: ReactNode
  brandName: string
  hasUnreadNotifications?: boolean
  onNotificationClick?: () => void
  className?: string
}

export function MobileTopBar({
  logo,
  brandName,
  hasUnreadNotifications = false,
  onNotificationClick,
  className,
}: MobileTopBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl text-primary-foreground [&_img]:size-6 [&_svg]:size-5">
          {logo}
        </span>
        <span className="text-xl font-bold tracking-tight text-foreground">
          {brandName}
        </span>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        onClick={onNotificationClick}
        className="relative flex size-9 items-center justify-center rounded-full"
      >
        <Bell className="size-5 text-muted-foreground" />
        {hasUnreadNotifications && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
        )}
      </button>
    </div>
  )
}

export interface BottomNavItem {
  label: string
  icon: ReactNode
  isActive?: boolean
  onClick?: () => void
}

export interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Bottom navigation"
      className={cn(
        'flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          aria-current={item.isActive ? 'page' : undefined}
          onClick={item.onClick}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium [&_svg]:size-6',
            item.isActive ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
} 