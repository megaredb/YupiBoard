import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { FormSection } from "@/features/events/components/create-event/form-section";
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context";
import { CREATE_EVENT_LIMITS } from "@/features/events/schemas/create-event.schema";

export function GeneralSection() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const {
    register,
    control,
    formState: { errors },
  } = useCreateEventFormContext();
  const descriptionLength = useWatch({ control, name: "description" }).length;

  return (
    <FormSection
      title={t("events.create.general.title")}
      description={t("events.create.general.description")}
      headerNote={t("common.requiredFields")}
    >
      <FormField
        label={t("events.create.fields.title")}
        isRequired
        hint={t("events.create.fields.titleHint", {
          min: CREATE_EVENT_LIMITS.titleMin,
          max: CREATE_EVENT_LIMITS.titleMax,
        })}
        error={fieldError(errors.title?.message)}
      >
        {(fieldControl) => (
          <Input
            {...fieldControl}
            {...register("title")}
            maxLength={CREATE_EVENT_LIMITS.titleMax}
            placeholder={t("events.create.fields.titlePlaceholder")}
          />
        )}
      </FormField>

      <FormField
        label={t("events.create.fields.gameTitle")}
        isRequired
        error={fieldError(errors.gameTitle?.message)}
      >
        {(fieldControl) => (
          <Input
            {...fieldControl}
            {...register("gameTitle")}
            maxLength={CREATE_EVENT_LIMITS.gameTitleMax}
            placeholder={t("events.create.fields.gameTitlePlaceholder")}
          />
        )}
      </FormField>

      <FormField
        label={t("events.create.fields.description")}
        isRequired
        error={fieldError(errors.description?.message)}
        counter={`${descriptionLength}/${CREATE_EVENT_LIMITS.descriptionMax}`}
      >
        {(fieldControl) => (
          <Textarea
            {...fieldControl}
            {...register("description")}
            rows={4}
            maxLength={CREATE_EVENT_LIMITS.descriptionMax}
            placeholder={t("events.create.fields.descriptionPlaceholder")}
          />
        )}
      </FormField>
    </FormSection>
  );
}
