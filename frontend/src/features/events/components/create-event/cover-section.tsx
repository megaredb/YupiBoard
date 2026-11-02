import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormField } from "@/shared/components/form-field"
import { ImageDropzone } from "@/shared/components/image-dropzone"
import { useFieldError } from "@/shared/i18n/use-field-error"
import { FormSection } from "@/features/events/components/create-event/form-section"
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context"

export function CoverSection() {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const {
    control,
    formState: { errors },
  } = useCreateEventFormContext()

  return (
    <FormSection title={t("events.create.cover.title")}>
      <FormField
        label={t("events.create.cover.title")}
        isLabelHidden
        error={fieldError(errors.coverImage?.message)}
      >
        {(fieldControl) => (
          <Controller
            control={control}
            name="coverImage"
            render={({ field }) => (
              <ImageDropzone
                control={fieldControl}
                value={field.value}
                onChange={field.onChange}
                hint={t("events.create.cover.hint")}
              />
            )}
          />
        )}
      </FormField>
    </FormSection>
  )
}
