import { MapPin } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { CityRead } from "@/shared/api/generated/model";
import { FormField } from "@/shared/components/form-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { CitySelect, NearestCityButton } from "@/features/locations";
import type { CompleteProfileFormValues } from "@/features/profile/schemas/profile.schema";

interface ProfileCityFieldProps {
  /** The stored city, kept selectable when the backend no longer lists it. */
  savedCity: string | null | undefined;
  isPending: boolean;
}

export function ProfileCityField({ savedCity, isPending }: ProfileCityFieldProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CompleteProfileFormValues>();
  const handleNearestCity = (city: CityRead) =>
    setValue("city", city.name, { shouldDirty: true, shouldValidate: true });

  return (
    <div className="space-y-1">
      <FormField
        label={t("profile.fields.city")}
        optionalText={t("common.optional")}
        hint={t("profile.locationHint")}
        error={fieldError(errors.city?.message)}
      >
        {(fieldControl) => (
          <CitySelect
            {...fieldControl}
            {...register("city")}
            startIcon={<MapPin />}
            emptyLabel={t("profile.cityNotSet")}
            legacyValue={savedCity}
            disabled={isPending}
          />
        )}
      </FormField>
      <NearestCityButton onFound={handleNearestCity} isDisabled={isPending} />
    </div>
  );
}
