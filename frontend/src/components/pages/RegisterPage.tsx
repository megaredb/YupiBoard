import { useState } from "react"
import { Link, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRegisterApiV1AuthRegisterPost } from "@/api/endpoints/auth/auth"
import { FormField } from "@/components/FormField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/stores/auth"

// Messages are i18n keys, translated when rendered. Limits mirror the API schema.
const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "validation.nameMin").max(255, "validation.nameMax"),
    email: z.email("validation.email"),
    password: z.string().min(8, "validation.passwordMin").max(128, "validation.passwordMax"),
    confirmPassword: z.string().min(1, "validation.confirmRequired"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "validation.mismatch",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const registerMutation = useRegisterApiV1AuthRegisterPost({
    mutation: {
      onSuccess: (data) => setSession(data),
      onError: (error) => setServerError(getErrorMessage(error, t("register.failed"))),
    },
  })

  const fieldError = (key?: string) => (key ? t(key) : undefined)

  if (user) return <Navigate to="/" replace />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("register.title")}</CardTitle>
      </CardHeader>

      <form
        noValidate
        onSubmit={handleSubmit(({ full_name, email, password }) => {
          setServerError(null)
          registerMutation.mutate({ data: { full_name, email, password } })
        })}
      >
        <CardContent className="space-y-4">
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <FormField
            label={t("register.fullName")}
            autoComplete="name"
            error={fieldError(errors.full_name?.message)}
            disabled={registerMutation.isPending}
            {...register("full_name")}
          />
          <FormField
            label={t("register.email")}
            type="email"
            autoComplete="email"
            error={fieldError(errors.email?.message)}
            disabled={registerMutation.isPending}
            {...register("email")}
          />
          <FormField
            label={t("register.password")}
            type="password"
            autoComplete="new-password"
            error={fieldError(errors.password?.message)}
            disabled={registerMutation.isPending}
            {...register("password")}
          />
          <FormField
            label={t("register.confirmPassword")}
            type="password"
            autoComplete="new-password"
            error={fieldError(errors.confirmPassword?.message)}
            disabled={registerMutation.isPending}
            {...register("confirmPassword")}
          />
        </CardContent>

        <CardFooter className="mt-4 flex-col items-stretch gap-3">
          <Button type="submit" isLoading={registerMutation.isPending}>
            {t("register.submit")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("register.hasAccount")}{" "}
            <Link to="/login" className="text-foreground underline">
              {t("register.login")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
