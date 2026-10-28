import type { ReactNode } from "react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Field } from "@/components/form/Field"
import { ImageDropzone } from "@/components/shared/ImageDropzone"
import { NumberStepper } from "@/components/shared/NumberStepper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CREATE_EVENT_LIMITS as LIMITS } from "../../constants"
import { AddressField } from "./AddressField"
import type { CreateEventFormValues } from "./createEventSchema"

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

interface CreateEventFieldsProps {
  form: UseFormReturn<CreateEventFormValues>
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export function CreateEventFields({ form }: CreateEventFieldsProps) {
  const { t } = useTranslation()
  const { register, control, setValue, formState: { errors } } = form
  const descriptionLength = useWatch({ control, name: "description" }).length
  const fieldError = (key?: string) => (key ? t(key) : undefined)
  const today = todayIso()

  return (
    <>
      <FormSection title={t("createEvent.general.title")} description={t("createEvent.general.description")}>
        <Field
          label={t("createEvent.fields.title")}
          required
          hint={t("createEvent.fields.titleHint", { min: LIMITS.titleMin, max: LIMITS.titleMax })}
          error={fieldError(errors.title?.message)}
        >
          {(fieldControl) => (
            <Input
              {...fieldControl}
              {...register("title")}
              placeholder={t("createEvent.fields.titlePlaceholder")}
              className="h-10"
            />
          )}
        </Field>

        <Field
          label={t("createEvent.fields.description")}
          hint={t("createEvent.fields.descriptionHint")}
          error={fieldError(errors.description?.message)}
          counter={`${descriptionLength}/${LIMITS.descriptionMax}`}
        >
          {(fieldControl) => (
            <Textarea
              {...fieldControl}
              {...register("description")}
              rows={4}
              placeholder={t("createEvent.fields.descriptionPlaceholder")}
            />
          )}
        </Field>
      </FormSection>

      <FormSection title={t("createEvent.when.title")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("createEvent.fields.date")} required error={fieldError(errors.date?.message)}>
            {(fieldControl) => <Input {...fieldControl} {...register("date")} type="date" min={today} className="h-10" />}
          </Field>
          <Field label={t("createEvent.fields.time")} required error={fieldError(errors.time?.message)}>
            {(fieldControl) => <Input {...fieldControl} {...register("time")} type="time" className="h-10" />}
          </Field>
        </div>

        <Field
          label={t("createEvent.fields.address")}
          required
          hint={t("createEvent.fields.addressHint")}
          error={fieldError(errors.address?.message)}
        >
          {(fieldControl) => (
            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <AddressField
                  id={fieldControl.id}
                  aria-describedby={fieldControl["aria-describedby"]}
                  invalid={Boolean(fieldControl["aria-invalid"])}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(address, venueName) => {
                    field.onChange(address)
                    setValue("venueName", venueName)
                  }}
                />
              )}
            />
          )}
        </Field>
      </FormSection>

      <FormSection title={t("createEvent.players.title")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("createEvent.fields.seats")}
            required
            hint={t("createEvent.fields.seatsHint")}
            error={fieldError(errors.seatsTotal?.message)}
          >
            {(fieldControl) => (
              <Controller
                control={control}
                name="seatsTotal"
                render={({ field }) => (
                  <NumberStepper
                    {...fieldControl}
                    value={field.value}
                    onChange={field.onChange}
                    min={LIMITS.seatsMin}
                    max={LIMITS.seatsMax}
                    decreaseLabel={t("createEvent.fields.seatsDecrease")}
                    increaseLabel={t("createEvent.fields.seatsIncrease")}
                  />
                )}
              />
            )}
          </Field>

          <Field
            label={t("createEvent.fields.price")}
            hint={t("createEvent.fields.priceHint")}
            error={fieldError(errors.price?.message)}
          >
            {(fieldControl) => (
              <Input
                {...fieldControl}
                {...register("price", { valueAsNumber: true })}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className="h-10"
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("createEvent.cover.title")}>
        <Field
          label={t("createEvent.cover.title")}
          error={fieldError(errors.coverImage?.message)}
          className="space-y-1.5 [&>label]:sr-only"
        >
          {(fieldControl) => (
            <Controller
              control={control}
              name="coverImage"
              render={({ field }) => (
                <ImageDropzone
                  id={fieldControl.id}
                  aria-describedby={fieldControl["aria-describedby"]}
                  invalid={Boolean(fieldControl["aria-invalid"])}
                  value={field.value}
                  onChange={field.onChange}
                  accept={LIMITS.coverTypes}
                  hint={t("createEvent.cover.hint")}
                />
              )}
            />
          )}
        </Field>
      </FormSection>
    </>
  )
}
