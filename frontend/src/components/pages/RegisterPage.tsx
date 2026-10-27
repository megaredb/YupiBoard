import { useId, useState } from "react"
import { Link, Navigate, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Lock, Mail } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useRegisterApiV1AuthRegisterPost } from "@/api/endpoints/auth/auth"
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

// Messages are i18n keys, translated when rendered. Limits mirror the SRS & API schema.
const registerSchema = z
  .object({
    email: z.email("validation.email"),
    password: z
      .string()
      .min(8, "validation.passwordMin")
      .max(128, "validation.passwordMax"),
    confirmPassword: z.string().min(1, "validation.confirmRequired"),
    isAdult: z.boolean().refine((val) => val === true, {
      message: "validation.ageRequired",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "validation.mismatch",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ageCheckboxId = useId()
  const ageErrorId = `${ageCheckboxId}-error`
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      isAdult: false,
    },
  })

  const registerMutation = useRegisterApiV1AuthRegisterPost({
    mutation: {
      onSuccess: async (data) => {
        if (data.user.status === "Banned" || data.user.is_active === false) {
          setServerError(t("errors.accountBanned"))
          return
        }
        await setSession(data)
      },
      onError: (error) => {
        setServerError(getErrorMessage(error, t("register.failed")))
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

  const isBusy = registerMutation.isPending

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center py-6">
      <Card className="rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-4">
        <CardHeader className="justify-items-center space-y-3 text-center">
          <BrandLogo size="md" />

          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {t("register.title")}
            </CardTitle>
            <CardDescription className="mx-auto max-w-xs text-sm text-muted-foreground">
              {t("register.subtitle")}
            </CardDescription>
          </div>

          <div className="w-full pt-2 sm:hidden">
            <Tabs
              value="register"
              onValueChange={(value) => {
                if (value === "login") void navigate({ to: "/login" })
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
          <GoogleAuthButton
            label={t("register.google")}
            disabled={isBusy}
            onError={(msg) => setServerError(msg)}
          />

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {t("register.orEmail")}
            </span>
            <Separator className="flex-1" />
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
            onSubmit={handleSubmit(({ email, password, isAdult }) => {
              setServerError(null)
              registerMutation.mutate({
                data: {
                  email,
                  password,
                  is_adult: isAdult,
                },
              })
            })}
          >
            <FormField
              label={t("register.email")}
              type="email"
              autoComplete="email"
              placeholder={t("register.emailPlaceholder")}
              startIcon={<Mail />}
              error={fieldError(errors.email?.message)}
              disabled={isBusy}
              {...register("email")}
            />

            <FormField
              label={t("register.password")}
              type="password"
              autoComplete="new-password"
              placeholder={t("register.passwordPlaceholder")}
              startIcon={<Lock />}
              helperText={t("register.passwordHint")}
              error={fieldError(errors.password?.message)}
              disabled={isBusy}
              {...register("password")}
            />

            <FormField
              label={t("register.confirmPassword")}
              type="password"
              autoComplete="new-password"
              placeholder={t("register.confirmPasswordPlaceholder")}
              startIcon={<Lock />}
              error={fieldError(errors.confirmPassword?.message)}
              disabled={isBusy}
              {...register("confirmPassword")}
            />

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2.5">
                <Controller
                  control={control}
                  name="isAdult"
                  render={({ field }) => (
                    <Checkbox
                      id={ageCheckboxId}
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      aria-invalid={errors.isAdult ? true : undefined}
                      aria-describedby={errors.isAdult ? ageErrorId : undefined}
                      disabled={isBusy}
                    />
                  )}
                />
                <Label
                  htmlFor={ageCheckboxId}
                  className="cursor-pointer text-xs font-normal text-foreground"
                >
                  {t("register.ageConfirm")}
                </Label>
              </div>
              {errors.isAdult?.message && (
                <p
                  id={ageErrorId}
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-destructive"
                >
                  <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldError(errors.isAdult.message)}</span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-10 w-full text-sm font-medium"
              isLoading={isBusy}
            >
              {t("register.submit")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-0 bg-transparent pt-2 pb-4">
          <p className="text-center text-xs text-muted-foreground">
            {t("register.hasAccount")}{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t("register.login")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
