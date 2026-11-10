import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextField } from "@/shared/components/text-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { PERSON_NAME_LIMITS } from "@/shared/lib/validators/person-name";
import type { CompleteProfileFormValues } from "@/features/profile/schemas/profile.schema";

interface PersonNameFieldsProps {
  isPending: boolean;
  className?: string;
}

export function PersonNameFields({ isPending, className }: PersonNameFieldsProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    formState: { errors },
  } = useFormContext<CompleteProfileFormValues>();

  return (
    <div className={className}>
      <TextField
        label={t("profile.fields.firstName")}
        isRequired
        autoComplete="given-name"
        maxLength={PERSON_NAME_LIMITS.max}
        error={fieldError(errors.first_name?.message)}
        disabled={isPending}
        {...register("first_name")}
      />
      <TextField
        label={t("profile.fields.lastName")}
        isRequired
        autoComplete="family-name"
        maxLength={PERSON_NAME_LIMITS.max}
        error={fieldError(errors.last_name?.message)}
        disabled={isPending}
        {...register("last_name")}
      />
    </div>
  );
}
