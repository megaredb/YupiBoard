import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import axios from "axios"
import { useTranslation } from "react-i18next"
import { healthCheckApiV1HealthGet } from "@/api/endpoints/health/health"
import { getCurrentUserProfileApiV1UsersMeGet } from "@/api/endpoints/users/users"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"

interface TestResult {
  ok: boolean
  status?: number
  ms: number
  body: unknown
}

interface ApiTestProps {
  title: string
  endpoint: string
  run: () => Promise<unknown>
  autoRun?: boolean
}

function ApiTest({ title, endpoint, run, autoRun = false }: ApiTestProps) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(autoRun)
  const [result, setResult] = useState<TestResult | null>(null)
  const latestRun = useRef(0)

  const execute = useCallback(async () => {
    const runId = ++latestRun.current
    const startedAt = performance.now()

    let outcome: Omit<TestResult, "ms">
    try {
      outcome = { ok: true, body: await run() }
    } catch (error) {
      outcome = axios.isAxiosError(error)
        ? { ok: false, status: error.response?.status, body: error.response?.data ?? error.message }
        : { ok: false, body: String(error) }
    }

    // A newer run superseded this one; let it report instead.
    if (runId !== latestRun.current) return
    setResult({ ...outcome, ms: Math.round(performance.now() - startedAt) })
    setPending(false)
  }, [run])

  useEffect(() => {
    if (autoRun) void execute()
  }, [autoRun, execute])

  const start = () => {
    setPending(true)
    void execute()
  }

  const verdict = result?.ok
    ? t("home.ok")
    : result?.status
      ? t("home.httpError", { status: result.status })
      : t("home.noResponse")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <code className="text-xs text-muted-foreground">{endpoint}</code>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={start} isLoading={pending}>
            {t("home.run")}
          </Button>
          {result && (
            <span className={cn("text-sm", result.ok ? "text-success" : "text-destructive")}>
              {verdict} · {result.ms} ms
            </span>
          )}
        </div>
        {result && (
          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

function Session() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const logout = useAuthStore((state) => state.logout)

  if (isLoading) return null

  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {t("home.signedInAs", { email: user.email })}
        </span>
        <Button variant="outline" size="sm" onClick={() => void logout()}>
          {t("home.logout")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Link to="/login" className={buttonVariants({ size: "sm" })}>
        {t("home.login")}
      </Link>
      <Link to="/register" className={buttonVariants({ variant: "outline", size: "sm" })}>
        {t("home.register")}
      </Link>
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6">
      <Session />

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("home.apiTesting")}</h1>
        <a
          href={`${API_BASE_URL}/docs`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("home.docs")}
        </a>
      </div>

      <ApiTest
        title={t("home.health")}
        endpoint="GET /api/v1/health"
        run={healthCheckApiV1HealthGet}
        autoRun
      />
      <ApiTest
        title={t("home.currentUser")}
        endpoint="GET /api/v1/users/me"
        run={getCurrentUserProfileApiV1UsersMeGet}
      />
    </div>
  )
}
