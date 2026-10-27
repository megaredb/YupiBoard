import { useEffect, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Bell, ChevronDown, LogOut, Moon, Sun, User, UserCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"

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

export function Navbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const logout = useAuthStore((state) => state.logout)
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const handleLogout = async () => {
    await logout()
    void navigate({ to: "/" })
  }

  const dash = t("profile.notProvided")
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email ||
    dash

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <BrandLogo size="sm" />
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-6 md:flex"
          >
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
            >
              {t("nav.events")}
            </Link>
            {user && (
              <>
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.myEvents")}
                </Link>
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.myBookings")}
                </Link>
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.favorite")}
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {!isLoading && user && (
            <Button
              type="button"
              size="default"
              className="hidden h-9 rounded-lg px-3.5 text-xs font-medium sm:inline-flex"
            >
              {t("nav.createEvent")}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("nav.toggleTheme")}
            onClick={() => setIsDark((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>

          {!isLoading && user && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("nav.notifications")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Bell className="size-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-muted">
                  <Avatar className="size-8 border border-border">
                    {user.avatar_url && (
                      <AvatarImage src={user.avatar_url} alt={displayName} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getUserInitials(
                        user.first_name,
                        user.last_name,
                        user.email,
                        dash
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="space-y-0.5">
                      <p className="truncate text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      <p className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => void navigate({ to: "/profile" })}
                  >
                    <User className="size-4" />
                    <span>{t("nav.myProfile")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      void navigate({
                        to: "/users/$userId",
                        params: { userId: user.id },
                      })
                    }
                  >
                    <UserCheck className="size-4" />
                    <span>{t("nav.publicProfile")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void handleLogout()}
                  >
                    <LogOut className="size-4" />
                    <span>{t("nav.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!isLoading && !user && (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/register"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" })
                )}
              >
                {t("nav.register")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
