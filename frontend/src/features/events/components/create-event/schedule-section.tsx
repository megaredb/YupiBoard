import { Building2, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { getTodayIsoDate } from "@/shared/lib/date/iso-date";
import { Input } from "@/shared/ui/input";
import { FormSection } from "@/features/events/components/create-event/form-section";
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context";
import { CREATE_EVENT_LIMITS } from "@/features/events/schemas/create-event.schema";
import { CitySelect } from "@/features/locations";

export function ScheduleSection() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    formState: { errors },
  } = useCreateEventFormContext();

  return (
    <FormSection title={t("events.create.when.title")}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t("events.create.fields.date")}
          isRequired
          error={fieldError(errors.date?.message)}
        >
          {(fieldControl) => (
            <Input {...fieldControl} {...register("date")} type="date" min={getTodayIsoDate()} />
          )}
        </FormField>
        <FormField
          label={t("events.create.fields.time")}
          isRequired
          error={fieldError(errors.time?.message)}
        >
          {(fieldControl) => <Input {...fieldControl} {...register("time")} type="time" />}
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={t("events.create.fields.city")} isRequired>
          {(fieldControl) => <CitySelect {...fieldControl} {...register("city")} />}
        </FormField>
        <TextField
          label={t("events.create.fields.venueName")}
          optionalText={t("common.optional")}
          startIcon={<Building2 />}
          maxLength={CREATE_EVENT_LIMITS.venueNameMax}
          placeholder={t("events.create.fields.venueNamePlaceholder")}
          error={fieldError(errors.venueName?.message)}
          {...register("venueName")}
        />
      </div>

      <TextField
        label={t("events.create.fields.address")}
        isRequired
        startIcon={<MapPin />}
        autoComplete="street-address"
        maxLength={CREATE_EVENT_LIMITS.addressMax}
        placeholder={t("events.create.fields.addressPlaceholder")}
        hint={t("events.create.fields.addressHint")}
        error={fieldError(errors.address?.message)}
        {...register("address")}
      />
    </FormSection>
  );
}
