import { MapPin } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { CityRead } from "@/shared/api/generated/model";
import { FormField } from "@/shared/components/form-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { CityCombobox, NearestCityButton } from "@/features/locations";
import type { CompleteProfileFormValues } from "@/features/profile/schemas/profile.schema";

interface ProfileCityFieldProps {
  isPending: boolean;
}

export function ProfileCityField({ isPending }: ProfileCityFieldProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CompleteProfileFormValues>();
  const handleNearestCity = (city: CityRead) =>
    setValue("city", city.canonical_name, { shouldDirty: true, shouldValidate: true });

  return (
    <div className="space-y-1">
      <Controller
        control={control}
        name="city"
        render={({ field }) => (
          <FormField
            label={t("profile.fields.city")}
            optionalText={t("common.optional")}
            hint={t("profile.locationHint")}
            error={fieldError(errors.city?.message)}
          >
            {(fieldControl) => (
              <CityCombobox
                fieldControl={fieldControl}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                startIcon={<MapPin />}
                isClearable
                disabled={isPending}
              />
            )}
          </FormField>
        )}
      />
      <NearestCityButton onFound={handleNearestCity} isDisabled={isPending} />
    </div>
  );
}
