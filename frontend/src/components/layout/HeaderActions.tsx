import { Bell, LogOut, Plus, Settings, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { HeaderProps } from "./Header"

type HeaderActionsProps = Pick<
  HeaderProps,
  | "user"
  | "onCreateEvent"
  | "onNotificationClick"
  | "notificationsBadge"
  | "isUserMenuOpen"
  | "onUserMenuToggle"
  | "onLoginClick"
  | "onRegisterClick"
  | "onProfileClick"
  | "onSettingsClick"
  | "onLogoutClick"
>

const menuPanelClass =
  "absolute top-full z-50 mt-2 min-w-44 rounded-md border border-border bg-background p-1 text-sm shadow-md"
const menuItemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none [&_svg]:size-4"

export function HeaderActions({
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
}: HeaderActionsProps) {
  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <Button
          type="button"
          onClick={onCreateEvent}
          aria-label="Create event"
          className="h-9 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 sm:px-4"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create event</span>
        </Button>
        <Button type="button" variant="ghost" onClick={onLoginClick}>Log in</Button>
        <Button
          type="button"
          onClick={onRegisterClick}
          className="rounded-xl bg-primary px-5 font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Register
        </Button>
      </div>
    )
  }

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-3">
      <Button
        type="button"
        onClick={onCreateEvent}
        aria-label="Create event"
        className="h-9 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 sm:px-4"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">Create event</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onNotificationClick}
        aria-label={notificationsBadge ? `Notifications, ${notificationsBadge} unread` : "Notifications"}
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
            <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
          ) : (
            user.initials ?? <UserIcon className="size-4" />
          )}
        </button>

        {isUserMenuOpen && (
          <div className={cn(menuPanelClass, "right-0")}>
            <p className="truncate px-2 py-1.5 font-medium">{user.name}</p>
            <div className="my-1 h-px bg-border" />
            <button type="button" className={menuItemClass} onClick={onProfileClick}>
              <UserIcon />
              Profile
            </button>
            <button type="button" className={menuItemClass} onClick={onSettingsClick}>
              <Settings />
              Settings
            </button>
            <div className="my-1 h-px bg-border" />
            <button type="button" className={cn(menuItemClass, "text-destructive")} onClick={onLogoutClick}>
              <LogOut />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
