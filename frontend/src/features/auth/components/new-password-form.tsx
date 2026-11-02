import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "@/shared/components/text-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { PASSWORD_LIMITS } from "@/shared/lib/validators/password";
import {
  newPasswordSchema,
  type NewPasswordFormValues,
} from "@/features/auth/schemas/new-password.schema";

interface NewPasswordFormProps {
  isPending: boolean;
  onSubmit: (values: NewPasswordFormValues) => void;
  /** Submit (and cancel) buttons, so dialogs and pages lay them out their own way. */
  actions: ReactNode;
}

/** New password + confirmation; shared by password reset and "change password". */
export function NewPasswordForm({ isPending, onSubmit, actions }: NewPasswordFormProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useAppForm(newPasswordSchema, { defaultValues: { password: "", confirmPassword: "" } });

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label={t("auth.fields.newPassword")}
        type="password"
        autoComplete="new-password"
        maxLength={PASSWORD_LIMITS.max}
        hint={t("auth.fields.passwordHint")}
        error={fieldError(errors.password?.message)}
        disabled={isPending}
        {...register("password")}
      />
      <TextField
        label={t("auth.fields.confirmNewPassword")}
        type="password"
        autoComplete="new-password"
        error={fieldError(errors.confirmPassword?.message)}
        disabled={isPending}
        {...register("confirmPassword")}
      />
      {actions}
    </form>
  );
}
