import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "@/shared/components/text-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { PASSWORD_LIMITS } from "@/shared/lib/validators/password";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/features/profile/schemas/change-password.schema";

interface ChangePasswordFormProps {
  isPending: boolean;
  onSubmit: (values: ChangePasswordFormValues) => void;
  actions: ReactNode;
}

const DEFAULT_VALUES: ChangePasswordFormValues = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

export function ChangePasswordForm({ isPending, onSubmit, actions }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useAppForm(changePasswordSchema, { defaultValues: DEFAULT_VALUES });

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label={t("profile.passwordDialog.currentPassword")}
        type="password"
        autoComplete="current-password"
        maxLength={PASSWORD_LIMITS.max}
        hint={t("profile.passwordDialog.currentPasswordHint")}
        error={fieldError(errors.currentPassword?.message)}
        disabled={isPending}
        {...register("currentPassword")}
      />
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
        maxLength={PASSWORD_LIMITS.max}
        error={fieldError(errors.confirmPassword?.message)}
        disabled={isPending}
        {...register("confirmPassword")}
      />
      {actions}
    </form>
  );
}
