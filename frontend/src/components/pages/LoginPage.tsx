import { useState } from "react"
import { Link, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLoginApiV1AuthLoginPost } from "@/api/endpoints/auth/auth"
import { FormField } from "@/components/FormField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/stores/auth"

// Messages are i18n keys, translated when rendered.
const loginSchema = z.object({
  email: z.email("validation.email"),
  password: z.string().min(1, "validation.passwordRequired"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const loginMutation = useLoginApiV1AuthLoginPost({
    mutation: {
      onSuccess: (data) => setSession(data),
      onError: (error) => setServerError(getErrorMessage(error, t("login.failed"))),
    },
  })

  const fieldError = (key?: string) => (key ? t(key) : undefined)

  if (user) return <Navigate to="/" replace />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("login.title")}</CardTitle>
      </CardHeader>

      <form
        noValidate
        onSubmit={handleSubmit((values) => {
          setServerError(null)
          loginMutation.mutate({ data: values })
        })}
      >
        <CardContent className="space-y-4">
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <FormField
            label={t("login.email")}
            type="email"
            autoComplete="email"
            error={fieldError(errors.email?.message)}
            disabled={loginMutation.isPending}
            {...register("email")}
          />
          <FormField
            label={t("login.password")}
            type="password"
            autoComplete="current-password"
            error={fieldError(errors.password?.message)}
            disabled={loginMutation.isPending}
            {...register("password")}
          />
        </CardContent>

        <CardFooter className="mt-4 flex-col items-stretch gap-3">
          <Button type="submit" isLoading={loginMutation.isPending}>
            {t("login.submit")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link to="/register" className="text-foreground underline">
              {t("login.register")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
