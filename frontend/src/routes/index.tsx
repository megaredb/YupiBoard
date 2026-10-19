import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useHealthCheckApiV1HealthGet } from "@/api/endpoints/health/health"
import { useAuthStore } from "@/stores/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Layers,
  Lock,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

function HomeComponent() {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  const { data: health, isLoading: isHealthLoading, isError: isHealthError, refetch } =
    useHealthCheckApiV1HealthGet()

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          {t("home.badge")}
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-linear-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          {t("home.titlePrefix")} <span className="text-indigo-400">YupiBoard</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          {t("home.description")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <Link to="/profile">
              <Button size="lg" className="flex items-center gap-2">
                {t("home.goToProfile")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="flex items-center gap-2">
                  {t("home.getStarted")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  {t("home.signIn")}
                </Button>
              </Link>
            </>
          )}
          <a
            href="https://api.yupiboard.localhost/docs"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="lg" className="text-slate-400 hover:text-white">
              {t("home.swaggerDocs")}
            </Button>
          </a>
        </div>
      </section>

      {/* Live System Health Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glow-effect border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              {t("home.backendStatus")}
            </CardTitle>
            <Badge variant={isHealthError ? "destructive" : health?.status === "healthy" ? "success" : "warning"}>
              {isHealthLoading ? t("common.checking") : health?.status || t("common.offline")}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-400">
              {t("home.backendDesc")}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5">
              <span>{t("home.apiVersion")}</span>
              <span className="font-mono text-indigo-300">{health?.version || "0.1.0"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="w-full text-xs mt-2"
            >
              {t("home.refreshStatus")}
            </Button>
          </CardContent>
        </Card>

        <Card className="glow-effect border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              {t("home.postgresTitle")}
            </CardTitle>
            <Badge variant={health?.database === "connected" ? "success" : "destructive"}>
              {health?.database || "Disconnected"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-400">
              {t("home.postgresDesc")}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5">
              <span>{t("home.ormDriver")}</span>
              <span className="font-mono text-emerald-300">SQLAlchemy 2 + asyncpg</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{t("home.session")}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("common.active")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glow-effect border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              {t("home.mobileTitle")}
            </CardTitle>
            <Badge variant="default">{t("home.mobileBadge")}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-400">
              {t("home.mobileDesc")}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5">
              <span>{t("home.package")}</span>
              <span className="font-mono text-purple-300">@yupiboard/mobile</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{t("home.targetBundle")}</span>
              <span className="text-slate-300 font-mono">dist/ target</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Feature Showcase Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">{t("home.modulesTitle")}</h2>
          <p className="text-sm text-slate-400">
            {t("home.modulesSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-xl p-5 space-y-3 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">{t("home.secTitle")}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("home.secDesc")}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-3 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">{t("home.orvalTitle")}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("home.orvalDesc")}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-3 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">{t("home.routerTitle")}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("home.routerDesc")}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-3 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">{t("home.capTitle")}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("home.capDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* User Status Banner */}
      {isAuthenticated && user && (
        <Card className="border-indigo-500/30 bg-linear-to-r from-indigo-950/40 to-slate-900/60">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg">
                {user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user.full_name || t("common.user")}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={user.is_verified ? "success" : "warning"}>
                {user.is_verified ? t("home.emailVerified") : t("home.emailPending")}
              </Badge>
              <Link to="/profile">
                <Button size="sm" variant="secondary">
                  {t("home.profileSettings")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

