import { Lock, Mail } from "lucide-react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { PASSWORD_LIMITS } from "@/shared/lib/validators/password";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  registerSchema,
  type RegisterFormInput,
  type RegisterFormValues,
} from "@/features/auth/schemas/register.schema";

interface RegisterFormProps {
  isPending: boolean;
  onSubmit: (values: RegisterFormValues) => void;
}

const DEFAULT_VALUES: RegisterFormInput = {
  email: "",
  password: "",
  confirmPassword: "",
  isAdult: false,
};

export function RegisterForm({ isPending, onSubmit }: RegisterFormProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useAppForm(registerSchema, { defaultValues: DEFAULT_VALUES });

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
        autoComplete="new-password"
        maxLength={PASSWORD_LIMITS.max}
        startIcon={<Lock />}
        hint={t("auth.fields.passwordHint")}
        error={fieldError(errors.password?.message)}
        disabled={isPending}
        {...register("password")}
      />
      <TextField
        label={t("auth.fields.confirmPassword")}
        type="password"
        autoComplete="new-password"
        startIcon={<Lock />}
        error={fieldError(errors.confirmPassword?.message)}
        disabled={isPending}
        {...register("confirmPassword")}
      />
      <Controller
        control={control}
        name="isAdult"
        render={({ field }) => (
          <FormField
            label={t("auth.register.ageConfirm")}
            error={fieldError(errors.isAdult?.message)}
            className="flex flex-row-reverse flex-wrap items-center justify-end gap-2.5 space-y-0 [&>p]:w-full"
          >
            {(fieldControl) => (
              <Checkbox
                {...fieldControl}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isPending}
              />
            )}
          </FormField>
        )}
      />
      <Button type="submit" size="xl" className="w-full text-sm" isLoading={isPending}>
        {t("auth.register.submit")}
      </Button>
    </form>
  );
}
