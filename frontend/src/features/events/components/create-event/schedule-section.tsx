import { Building2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { getTodayIsoDate } from "@/shared/lib/date/iso-date";
import { DatePicker } from "@/shared/ui/date-picker";
import { TimePicker } from "@/shared/ui/time-picker";
import { AddressField } from "@/features/events/components/create-event/address-field";
import { FormSection } from "@/features/events/components/create-event/form-section";
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context";
import {
  CREATE_EVENT_LIMITS,
  START_IN_PAST_MESSAGE,
} from "@/features/events/schemas/create-event.schema";
import { CityCombobox } from "@/features/locations";

function ScheduleDateTimeRow() {
  const { t, i18n } = useTranslation();
  const fieldError = useFieldError();
  const {
    control,
    formState: { errors },
  } = useCreateEventFormContext();
  const isStartInPast = errors.date?.message === START_IN_PAST_MESSAGE;

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
        // The start-in-past error lives on `date`, so a new time must re-check it.
        rules={{ deps: "date" }}
        render={({ field }) => (
          <FormField
            label={t("events.create.fields.time")}
            isRequired
            error={fieldError(errors.time?.message)}
          >
            {(fieldControl) => (
              <TimePicker
                {...fieldControl}
                aria-invalid={isStartInPast || fieldControl["aria-invalid"]}
                value={field.value}
                onChange={field.onChange}
              />
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

  return (
    <FormSection title={t("events.create.when.title")}>
      <ScheduleDateTimeRow />

      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <FormField label={t("events.create.fields.city")} isRequired>
              {(fieldControl) => (
                <CityCombobox
                  fieldControl={fieldControl}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            </FormField>
          )}
        />
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

      <AddressField />
    </FormSection>
  );
}
