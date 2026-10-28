import { useState } from "react"
import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, CircleAlert } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useResetPasswordApiV1AuthResetPasswordPost } from "@/api/endpoints/auth/auth"
import { FormField } from "@/components/FormField"
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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "validation.passwordMin")
      .max(128, "validation.passwordMax"),
    confirmPassword: z.string().min(1, "validation.confirmRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.mismatch",
    path: ["confirmPassword"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: "/reset-password" }) as { token?: string }
  const token = search.token

  const [isSuccess, setIsSuccess] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const resetPasswordMutation = useResetPasswordApiV1AuthResetPasswordPost()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const fieldError = (key?: string) => (key ? t(key) : undefined)

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return
    try {
      setResetError(null)
      await resetPasswordMutation.mutateAsync({
        data: {
          token,
          new_password: values.password,
        },
      })
      setIsSuccess(true)
    } catch (err) {
      setResetError(getErrorMessage(err, t("common.error")))
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center py-6">
      <div className="mb-6 flex justify-center">
        <BrandLogo size="md" />
      </div>

      <Card className="rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-4">
        {!token && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <CircleAlert className="size-6" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {t("resetPassword.errorTitle")}
              </CardTitle>
              <CardDescription className="text-sm text-destructive">
                {t("resetPassword.missingToken")}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => void navigate({ to: "/login" })}
              >
                {t("resetPassword.tryAgainButton")}
              </Button>
            </CardFooter>
          </>
        )}

        {token && isSuccess && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {t("resetPassword.successTitle")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("resetPassword.successMessage")}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => void navigate({ to: "/login" })}
              >
                {t("resetPassword.loginButton")}
              </Button>
            </CardFooter>
          </>
        )}

        {token && !isSuccess && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {t("resetPassword.title")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("resetPassword.subtitle")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {resetError && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {resetError}
                  </div>
                )}

                <FormField
                  label={t("resetPassword.newPassword")}
                  type="password"
                  autoComplete="new-password"
                  helperText={t("register.passwordHint")}
                  error={fieldError(errors.password?.message)}
                  disabled={resetPasswordMutation.isPending}
                  {...register("password")}
                />

                <FormField
                  label={t("resetPassword.confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  error={fieldError(errors.confirmPassword?.message)}
                  disabled={resetPasswordMutation.isPending}
                  {...register("confirmPassword")}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="h-10 w-full text-sm font-medium"
                  isLoading={resetPasswordMutation.isPending}
                >
                  {t("resetPassword.submit")}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center border-0 bg-transparent pt-2 pb-4">
              <Link
                to="/login"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("resetPassword.tryAgainButton")}
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
