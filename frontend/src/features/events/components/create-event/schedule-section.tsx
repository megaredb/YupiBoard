import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { getTodayIsoDate } from "@/shared/lib/date/iso-date";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { FormSection } from "@/features/events/components/create-event/form-section";
import { useCityOptions } from "@/features/events/hooks/use-city-options";
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context";
import { CREATE_EVENT_LIMITS } from "@/features/events/schemas/create-event.schema";

export function ScheduleSection() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const cityOptions = useCityOptions();
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

      <div className="grid gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
        <FormField label={t("events.create.fields.city")} isRequired>
          {(fieldControl) => (
            <NativeSelect {...fieldControl} {...register("city")} options={cityOptions} />
          )}
        </FormField>
        <FormField
          label={t("events.create.fields.address")}
          isRequired
          hint={t("events.create.fields.addressHint")}
          error={fieldError(errors.address?.message)}
        >
          {(fieldControl) => (
            <div className="relative">
              <MapPin
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                {...fieldControl}
                {...register("address")}
                autoComplete="street-address"
                maxLength={CREATE_EVENT_LIMITS.addressMax}
                placeholder={t("events.create.fields.addressPlaceholder")}
                className="pl-9"
              />
            </div>
          )}
        </FormField>
      </div>
    </FormSection>
  );
}
