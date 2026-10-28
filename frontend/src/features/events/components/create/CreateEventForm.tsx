import { useState, type ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShieldCheck } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Field } from "@/components/form/Field"
import { ImageDropzone } from "@/components/shared/ImageDropzone"
import { NumberStepper } from "@/components/shared/NumberStepper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useGoBack } from "@/hooks/useGoBack"
import { getErrorMessage } from "@/lib/errors"
import { useCreateEvent } from "../../api"
import { CREATE_EVENT_LIMITS as LIMITS } from "../../constants"
import { AddressField } from "./AddressField"
import { createEventSchema, type CreateEventFormValues } from "./createEventSchema"

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
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

const todayIso = () => new Date().toISOString().slice(0, 10)

export function CreateEventForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const goBack = useGoBack("/events")
  const createEvent = useCreateEvent()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      address: "",
      venueName: null,
      seatsTotal: LIMITS.seatsMin,
      price: 0,
      coverImage: null,
    },
  })

  const descriptionLength = useWatch({ control, name: "description" }).length
  const fieldError = (key?: string) => (key ? t(key) : undefined)

  const onSubmit = (values: CreateEventFormValues) => {
    setServerError(null)
    createEvent.mutate(
      {
        title: values.title,
        description: values.description.trim(),
        // Built in the browser's time zone. TODO(api): send the event's own zone once the backend defines it.
        startsAt: new Date(`${values.date}T${values.time}`).toISOString(),
        address: values.address,
        venueName: values.venueName,
        seatsTotal: values.seatsTotal,
        price: values.price,
        coverImage: values.coverImage,
      },
      {
        onSuccess: ({ id }) => void navigate({ to: "/events/$eventId", params: { eventId: id } }),
        onError: (error) => setServerError(getErrorMessage(error, t("createEvent.failed"))),
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormSection title={t("createEvent.general.title")} description={t("createEvent.general.description")}>
        <Field label={t("createEvent.fields.title")} required hint={t("createEvent.fields.titleHint", { min: LIMITS.titleMin, max: LIMITS.titleMax })} error={fieldError(errors.title?.message)}>
          {(control) => (
            <Input {...control} {...register("title")} placeholder={t("createEvent.fields.titlePlaceholder")} className="h-10" />
          )}
        </Field>

        <Field
          label={t("createEvent.fields.description")}
          hint={t("createEvent.fields.descriptionHint")}
          error={fieldError(errors.description?.message)}
          counter={`${descriptionLength}/${LIMITS.descriptionMax}`}
        >
          {(control) => (
            <Textarea {...control} {...register("description")} rows={4} placeholder={t("createEvent.fields.descriptionPlaceholder")} />
          )}
        </Field>
      </FormSection>

      <FormSection title={t("createEvent.when.title")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("createEvent.fields.date")} required error={fieldError(errors.date?.message)}>
            {(control) => <Input {...control} {...register("date")} type="date" min={todayIso()} className="h-10" />}
          </Field>
          <Field label={t("createEvent.fields.time")} required error={fieldError(errors.time?.message)}>
            {(control) => <Input {...control} {...register("time")} type="time" className="h-10" />}
          </Field>
        </div>

        <Field label={t("createEvent.fields.address")} required hint={t("createEvent.fields.addressHint")} error={fieldError(errors.address?.message)}>
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
          <Field label={t("createEvent.fields.seats")} required hint={t("createEvent.fields.seatsHint")} error={fieldError(errors.seatsTotal?.message)}>
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

          <Field label={t("createEvent.fields.price")} hint={t("createEvent.fields.priceHint")} error={fieldError(errors.price?.message)}>
            {(control) => (
              <Input {...control} {...register("price", { valueAsNumber: true })} type="number" inputMode="numeric" min={0} step={1} className="h-10" />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("createEvent.cover.title")}>
        <Field label={t("createEvent.cover.title")} error={fieldError(errors.coverImage?.message)} className="space-y-1.5 [&>label]:sr-only">
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

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="space-y-3 border-t pt-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t("createEvent.required")}</p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="lg" className="h-10 flex-1 sm:flex-none" onClick={goBack}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="lg" className="h-10 flex-1 sm:flex-none" isLoading={createEvent.isPending}>
              {t("createEvent.submit")}
            </Button>
          </div>
        </div>
        <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden className="size-3.5" />
          {t("createEvent.reviewNote")}
        </p>
      </div>
    </form>
  )
}
