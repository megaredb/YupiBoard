import { Lock, Mail } from "lucide-react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CheckboxField } from "@/shared/components/checkbox-field";
import { TextField } from "@/shared/components/text-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { applyServerFieldErrors } from "@/shared/lib/form/apply-server-field-errors";
import { PASSWORD_LIMITS } from "@/shared/lib/validators/password";
import { Button } from "@/shared/ui/button";
import {
  registerSchema,
  type RegisterFormInput,
  type RegisterFormValues,
} from "@/features/auth/schemas/register.schema";

interface RegisterFormProps {
  isPending: boolean;
  onSubmit: (values: RegisterFormValues, onError: (error: unknown) => void) => void;
}

const DEFAULT_VALUES: RegisterFormInput = {
  email: "",
  password: "",
  confirmPassword: "",
  isAdult: false,
  acceptedTerms: false,
};

const SERVER_FIELDS = ["email", "password"] as const;

function RegisterConsentCheckboxes({
  control,
  errors,
  isPending,
}: {
  control: Control<RegisterFormInput, unknown, RegisterFormValues>;
  errors: FieldErrors<RegisterFormInput>;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const fieldError = useFieldError();

  return (
    <>
      <Controller
        control={control}
        name="isAdult"
        render={({ field }) => (
          <CheckboxField
            label={t("auth.register.ageConfirm")}
            isChecked={field.value}
            onCheckedChange={field.onChange}
            error={fieldError(errors.isAdult?.message)}
            isDisabled={isPending}
          />
        )}
      />
      <Controller
        control={control}
        name="acceptedTerms"
        render={({ field }) => (
          <CheckboxField
            label={t("auth.register.termsConfirm")}
            isChecked={field.value}
            onCheckedChange={field.onChange}
            error={fieldError(errors.acceptedTerms?.message)}
            isDisabled={isPending}
          />
        )}
      />
    </>
  );
}

export function RegisterForm({ isPending, onSubmit }: RegisterFormProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useAppForm(registerSchema, { defaultValues: DEFAULT_VALUES });
  const submit = handleSubmit((values) =>
    onSubmit(values, (error) => applyServerFieldErrors(error, SERVER_FIELDS, setError)),
  );

  return (
    <form noValidate className="space-y-4" onSubmit={submit}>
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
      <RegisterConsentCheckboxes control={control} errors={errors} isPending={isPending} />
      <Button type="submit" size="xl" className="w-full text-sm" isLoading={isPending}>
        {t("auth.register.submit")}
      </Button>
    </form>
  );
}
