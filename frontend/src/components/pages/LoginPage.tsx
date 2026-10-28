import { useId, useState } from "react"
import { Link, Navigate, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Lock, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useLoginApiV1AuthLoginPost } from "@/api/endpoints/auth/auth"
import { FormField } from "@/components/FormField"
import { GoogleAuthButton } from "@/components/GoogleAuthButton"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getErrorMessage } from "@/lib/errors"
import { isProfileComplete, useAuthStore } from "@/stores/auth"

// Messages are i18n keys, translated when rendered.
const loginSchema = z.object({
  email: z.email("validation.email"),
  password: z.string().min(1, "validation.passwordRequired"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const rememberId = useId()
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const [rememberMe, setRememberMe] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const loginMutation = useLoginApiV1AuthLoginPost({
    mutation: {
      onSuccess: async (data) => {
        if (data.user.status === "Banned") {
          setServerError(t("errors.accountBanned"))
          return
        }
        await setSession(data)
      },
      onError: (error) => {
        setServerError(getErrorMessage(error, t("login.failed")))
      },
    },
  })

  const fieldError = (key?: string) => (key ? t(key) : undefined)

  if (user) {
    if (!isProfileComplete(user)) {
      return <Navigate to="/profile/complete" replace />
    }
    return <Navigate to="/" replace />
  }

  const isBusy = loginMutation.isPending

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center py-6">
      <Card className="rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-4">
        <CardHeader className="justify-items-center space-y-3 text-center">
          <div className="hidden sm:block">
            <BrandLogo size="md" />
          </div>
          <div className="sm:hidden">
            <BrandLogo variant="icon-only" size="lg" />
          </div>

          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              <span className="hidden sm:inline">{t("login.title")}</span>
              <span className="sm:hidden">{t("login.mobileTitle")}</span>
            </CardTitle>
            <CardDescription className="mx-auto max-w-xs text-sm text-muted-foreground">
              <span className="hidden sm:inline">{t("login.subtitle")}</span>
              <span className="sm:hidden">{t("login.mobileSubtitle")}</span>
            </CardDescription>
          </div>

          <div className="w-full pt-2 sm:hidden">
            <Tabs
              value="login"
              onValueChange={(value) => {
                if (value === "register") void navigate({ to: "/register" })
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="login">{t("login.tabLogin")}</TabsTrigger>
                <TabsTrigger value="register">{t("login.tabSignUp")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="hidden space-y-5 sm:block">
            <GoogleAuthButton
              label={t("login.google")}
              disabled={isBusy}
              onError={(msg) => setServerError(msg)}
            />

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="shrink-0 text-xs text-muted-foreground">
                {t("login.orEmail")}
              </span>
              <Separator className="flex-1" />
            </div>
          </div>

          {serverError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <form
            noValidate
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              setServerError(null)
              loginMutation.mutate({ data: values })
            })}
          >
            <FormField
              label={t("login.email")}
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              startIcon={<Mail />}
              error={fieldError(errors.email?.message)}
              disabled={isBusy}
              {...register("email")}
            />

            <FormField
              label={t("login.password")}
              type="password"
              autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")}
              startIcon={<Lock />}
              error={fieldError(errors.password?.message)}
              disabled={isBusy}
              {...register("password")}
            />

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={rememberId}
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  disabled={isBusy}
                />
                <Label
                  htmlFor={rememberId}
                  className="cursor-pointer text-xs font-normal text-foreground"
                >
                  {t("login.rememberMe")}
                </Label>
              </div>

              <Link
                to="/login"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-10 w-full text-sm font-medium"
              isLoading={isBusy}
            >
              <span className="hidden sm:inline">{t("login.submit")}</span>
              <span className="sm:hidden">{t("login.mobileSubmit")}</span>
            </Button>
          </form>

          <div className="space-y-4 sm:hidden">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="shrink-0 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {t("login.orContinueWith")}
              </span>
              <Separator className="flex-1" />
            </div>

            <GoogleAuthButton
              label={t("login.googleShort")}
              disabled={isBusy}
              onError={(msg) => setServerError(msg)}
            />
          </div>
        </CardContent>

        <CardFooter className="justify-center border-0 bg-transparent pt-2 pb-4">
          <p className="text-center text-xs text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t("login.register")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
