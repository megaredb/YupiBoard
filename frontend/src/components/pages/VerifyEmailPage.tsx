import { useEffect, useRef } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useVerifyEmailApiV1AuthVerifyEmailPost } from "@/api/endpoints/auth/auth"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getErrorMessage } from "@/lib/errors"

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: "/verify-email" }) as { token?: string }
  const token = search.token
  const hasTriggeredRef = useRef(false)

  const verifyEmailMutation = useVerifyEmailApiV1AuthVerifyEmailPost()

  useEffect(() => {
    if (token && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      verifyEmailMutation.mutate({ data: { token } })
    }
  }, [token, verifyEmailMutation])

  const isPending = Boolean(token) && verifyEmailMutation.isPending
  const isSuccess = verifyEmailMutation.isSuccess
  const isError = Boolean(!token || verifyEmailMutation.isError)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center p-4">
      <div className="mb-6">
        <BrandLogo size="md" />
      </div>

      <Card className="w-full rounded-2xl border border-border bg-card shadow-sm">
        {isPending && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {t("verifyEmail.title")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("verifyEmail.verifying")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              {t("verifyEmail.verifyingSubtitle")}
            </CardContent>
          </>
        )}

        {isSuccess && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {t("verifyEmail.successTitle")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("verifyEmail.successMessage")}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => void navigate({ to: "/login" })}
              >
                {t("verifyEmail.loginButton")}
              </Button>
            </CardFooter>
          </>
        )}

        {isError && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <CircleAlert className="size-6" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {t("verifyEmail.errorTitle")}
              </CardTitle>
              <CardDescription className="text-sm text-destructive">
                {!token
                  ? t("verifyEmail.missingToken")
                  : getErrorMessage(
                      verifyEmailMutation.error,
                      t("verifyEmail.errorTitle")
                    )}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => void navigate({ to: "/login" })}
              >
                {t("verifyEmail.loginButton")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => void navigate({ to: "/register" })}
              >
                {t("verifyEmail.registerButton")}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
