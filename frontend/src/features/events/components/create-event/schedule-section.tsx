import { Building2, MapPin } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { getTodayIsoDate } from "@/shared/lib/date/iso-date";
import { DatePicker } from "@/shared/ui/date-picker";
import { TimePicker } from "@/shared/ui/time-picker";
import { FormSection } from "@/features/events/components/create-event/form-section";
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context";
import { CREATE_EVENT_LIMITS } from "@/features/events/schemas/create-event.schema";
import { CitySelect } from "@/features/locations";

function ScheduleDateTimeRow() {
  const { t, i18n } = useTranslation();
  const fieldError = useFieldError();
  const {
    control,
    formState: { errors },
  } = useCreateEventFormContext();

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <FormField
            label={t("events.create.fields.date")}
            isRequired
            error={fieldError(errors.date?.message)}
          >
            {(fieldControl) => (
              <DatePicker
                {...fieldControl}
                locale={i18n.language}
                value={field.value}
                min={getTodayIsoDate()}
                onChange={field.onChange}
              />
            )}
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="time"
        render={({ field }) => (
          <FormField
            label={t("events.create.fields.time")}
            isRequired
            error={fieldError(errors.time?.message)}
          >
            {(fieldControl) => (
              <TimePicker {...fieldControl} value={field.value} onChange={field.onChange} />
            )}
          </FormField>
        )}
      />
    </div>
  );
}

export function ScheduleSection() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    control,
    formState: { errors },
  } = useCreateEventFormContext();
  const currentCity = useWatch({ control, name: "city" });

  return (
    <FormSection title={t("events.create.when.title")}>
      <ScheduleDateTimeRow />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={t("events.create.fields.city")} isRequired>
          {(fieldControl) => (
            <CitySelect {...fieldControl} {...register("city")} value={currentCity ?? ""} />
          )}
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
