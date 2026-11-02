import { Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TextField } from "@/shared/components/text-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { Button } from "@/shared/ui/button";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login.schema";

interface LoginFormProps {
  isPending: boolean;
  onSubmit: (values: LoginFormValues) => void;
  onForgotPassword: () => void;
}

export function LoginForm({ isPending, onSubmit, onForgotPassword }: LoginFormProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useAppForm(loginSchema, { defaultValues: { email: "", password: "" } });

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label={t("auth.fields.email")}
        type="email"
        autoComplete="email"
        placeholder={t("auth.fields.emailPlaceholder")}
        startIcon={<Mail />}
        error={fieldError(errors.email?.message)}
        disabled={isPending}
        {...register("email")}
      />
      <TextField
        label={t("auth.fields.password")}
        type="password"
        autoComplete="current-password"
        startIcon={<Lock />}
        error={fieldError(errors.password?.message)}
        disabled={isPending}
        {...register("password")}
      />
      <div className="flex justify-end">
        <Button type="button" variant="link" size="sm" onClick={onForgotPassword}>
          {t("auth.login.forgotPassword")}
        </Button>
      </div>
      <Button type="submit" size="xl" className="w-full text-sm" isLoading={isPending}>
        {t("auth.login.submit")}
      </Button>
    </form>
  );
}
