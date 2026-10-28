import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'

import { cn } from '@/lib/utils'

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
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground [&_img]:size-6 [&_svg]:size-5">
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
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      className={cn(
        'grid w-full grid-flow-col overflow-hidden border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(0_0_0/0.04)]',
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
            'flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium [&_svg]:size-5',
            item.isActive ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {item.icon}
          <span className="max-w-full truncate">{item.label}</span>
        </button>
      ))}
    </nav>
  )
} 