import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LogIn, LogOut, ShieldCheck, User } from "lucide-react"

export function RootLayout() {
  const { t } = useTranslation()
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate({ to: "/login" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5 font-bold text-lg tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                YupiBoard
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                activeProps={{ className: "bg-white/10 text-white" }}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t("nav.home")}
              </Link>
              {isAuthenticated && (
                <Link
                  to="/profile"
                  activeProps={{ className: "bg-white/10 text-white" }}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  {t("nav.profile")}
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-xs text-slate-400 hidden sm:inline-block">
                  {user?.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("nav.logout")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">{t("nav.register")}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>{t("footer.text")}</p>
      </footer>
    </div>
  )
}
