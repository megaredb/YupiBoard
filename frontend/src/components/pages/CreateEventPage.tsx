import { useState, type ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Info, MapPin, ShieldCheck } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useCreateEventApiV1EventsPost } from "@/api/endpoints/events/events"
import type { EventCreateResponse } from "@/api/model"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { Field } from "@/components/FormField"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageDropzone } from "@/components/ui/image-dropzone"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { NumberStepper } from "@/components/ui/number-stepper"
import { StatusMessage } from "@/components/ui/status-message"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/errors"
import { CITY_OPTIONS, DEFAULT_CITY_ID, getCity, useGoBack } from "@/lib/events"
import { MAX_BANNER_BYTES, validateAndProcessImage } from "@/lib/image"

/** Limits mirror `EventCreate` in the OpenAPI schema. */
const LIMITS = {
  titleMin: 3,
  titleMax: 100,
  gameTitleMax: 150,
  descriptionMax: 2000,
  addressMax: 255,
  playersMin: 2,
  playersMax: 20,
  coverTypes: ["image/jpeg", "image/png"],
} as const

// Messages are i18n keys, translated when rendered (same convention as the auth forms).
const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(LIMITS.titleMin, "createEvent.validation.title")
      .max(LIMITS.titleMax, "createEvent.validation.title"),
    gameTitle: z
      .string()
      .trim()
      .min(1, "createEvent.validation.gameTitleRequired")
      .max(LIMITS.gameTitleMax, "createEvent.validation.gameTitleMax"),
    description: z
      .string()
      .trim()
      .min(1, "createEvent.validation.descriptionRequired")
      .max(LIMITS.descriptionMax, "createEvent.validation.descriptionMax"),
    date: z.string().min(1, "createEvent.validation.dateRequired"),
    time: z.string().min(1, "createEvent.validation.timeRequired"),
    city: z.string().min(1),
    address: z
      .string()
      .trim()
      .min(1, "createEvent.validation.addressRequired")
      .max(LIMITS.addressMax, "createEvent.validation.addressMax"),
    maxPlayers: z.number().int().min(LIMITS.playersMin).max(LIMITS.playersMax),
    price: z
      .number({ error: "createEvent.validation.priceInvalid" })
      .min(0, "createEvent.validation.priceInvalid"),
    coverImage: z
      .instanceof(File)
      .refine((file) => (LIMITS.coverTypes as readonly string[]).includes(file.type), "createEvent.validation.coverType")
      .refine((file) => file.size <= MAX_BANNER_BYTES, "createEvent.validation.coverSize")
      .nullable(),
  })
  .refine(({ date, time }) => !date || !time || new Date(`${date}T${time}`).getTime() > Date.now(), {
    path: ["date"],
    message: "createEvent.validation.dateFuture",
  })

type CreateEventFormValues = z.infer<typeof createEventSchema>

const CITY_SELECT_OPTIONS = CITY_OPTIONS.map((city) => ({ value: city.id, label: city.label }))
const todayIso = () => new Date().toISOString().slice(0, 10)

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

function CreateEventForm({ onCreated }: { onCreated: (response: EventCreateResponse) => void }) {
  const { t } = useTranslation()
  const goBack = useGoBack()
  const [serverError, setServerError] = useState<string | null>(null)
  const createEvent = useCreateEventApiV1EventsPost()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      gameTitle: "",
      description: "",
      date: "",
      time: "",
      city: DEFAULT_CITY_ID,
      address: "",
      maxPlayers: LIMITS.playersMin,
      price: 0,
      coverImage: null,
    },
  })
  const descriptionLength = useWatch({ control, name: "description" }).length
  const fieldError = (key?: string) => (key ? t(key) : undefined)

  const onSubmit = async (values: CreateEventFormValues) => {
    setServerError(null)

    let photoUrl: string | null = null
    if (values.coverImage) {
      const processed = await validateAndProcessImage(values.coverImage, MAX_BANNER_BYTES, 1280)
      if (!processed.ok) {
        setServerError(t("createEvent.validation.coverType"))
        return
      }
      photoUrl = processed.dataUrl
    }

    // No geocoding yet: the event is placed at the chosen city's center.
    const city = getCity(values.city)
    createEvent.mutate(
      {
        data: {
          title: values.title,
          game_title: values.gameTitle,
          description: values.description,
          city: city.name,
          address: values.address,
          lat: city.lat,
          lon: city.lon,
          start_datetime: new Date(`${values.date}T${values.time}`).toISOString(),
          max_players: values.maxPlayers,
          entry_cost: values.price,
          photo_url:
            photoUrl && (photoUrl.startsWith("http://") || photoUrl.startsWith("https://"))
              ? photoUrl
              : null,
        },
      },
      {
        onSuccess: onCreated,
        onError: (error) => setServerError(getErrorMessage(error, t("createEvent.failed"))),
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormSection title={t("createEvent.general.title")} description={t("createEvent.general.description")}>
        <Field
          label={t("createEvent.fields.title")}
          required
          hint={t("createEvent.fields.titleHint", { min: LIMITS.titleMin, max: LIMITS.titleMax })}
          error={fieldError(errors.title?.message)}
        >
          {(fieldControl) => (
            <Input {...fieldControl} {...register("title")} placeholder={t("createEvent.fields.titlePlaceholder")} className="h-10" />
          )}
        </Field>

        <Field label={t("createEvent.fields.gameTitle")} required error={fieldError(errors.gameTitle?.message)}>
          {(fieldControl) => (
            <Input
              {...fieldControl}
              {...register("gameTitle")}
              placeholder={t("createEvent.fields.gameTitlePlaceholder")}
              className="h-10"
            />
          )}
        </Field>

        <Field
          label={t("createEvent.fields.description")}
          required
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
            {(fieldControl) => <Input {...fieldControl} {...register("date")} type="date" min={todayIso()} className="h-10" />}
          </Field>
          <Field label={t("createEvent.fields.time")} required error={fieldError(errors.time?.message)}>
            {(fieldControl) => <Input {...fieldControl} {...register("time")} type="time" className="h-10" />}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
          <Field label={t("createEvent.fields.city")} required>
            {(fieldControl) => <NativeSelect {...fieldControl} {...register("city")} options={CITY_SELECT_OPTIONS} />}
          </Field>
          <Field
            label={t("createEvent.fields.address")}
            required
            hint={t("createEvent.fields.addressHint")}
            error={fieldError(errors.address?.message)}
          >
            {(fieldControl) => (
              <div className="relative">
                <MapPin aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...fieldControl}
                  {...register("address")}
                  autoComplete="street-address"
                  placeholder={t("createEvent.fields.addressPlaceholder")}
                  className="h-10 pl-9"
                />
              </div>
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("createEvent.players.title")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("createEvent.fields.seats")} required hint={t("createEvent.fields.seatsHint")}>
            {(fieldControl) => (
              <Controller
                control={control}
                name="maxPlayers"
                render={({ field }) => (
                  <NumberStepper
                    {...fieldControl}
                    value={field.value}
                    onChange={field.onChange}
                    min={LIMITS.playersMin}
                    max={LIMITS.playersMax}
                    decreaseLabel={t("createEvent.fields.seatsDecrease")}
                    increaseLabel={t("createEvent.fields.seatsIncrease")}
                  />
                )}
              />
            )}
          </Field>

          <Field label={t("createEvent.fields.price")} hint={t("createEvent.fields.priceHint")} error={fieldError(errors.price?.message)}>
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

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="space-y-3 border-t pt-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t("common.requiredFields")}</p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="lg" className="h-10 flex-1 sm:flex-none" onClick={goBack}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="lg"
              className="h-10 flex-1 sm:flex-none"
              isLoading={isSubmitting || createEvent.isPending}
            >
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

/** /events/new: focused flow without the app header/footer. */
export function CreateEventPage() {
  const { t } = useTranslation()
  const goBack = useGoBack()
  const [created, setCreated] = useState<EventCreateResponse | null>(null)

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
        <Link to="/events" className="inline-flex items-center rounded-lg">
          <BrandLogo size="sm" />
        </Link>

        <div className="mt-5 flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label={t("common.back")} onClick={goBack}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{t("createEvent.title")}</h1>
        </div>

        {created ? (
          <StatusMessage
            className="mt-6"
            title={t("createEvent.successTitle")}
            description={created.message || t("createEvent.successDescription")}
            action={
              <Link to="/events" className={buttonVariants()}>
                {t("events.details.backToEvents")}
              </Link>
            }
          />
        ) : (
          <>
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm text-primary">
              <Info aria-hidden className="size-4 shrink-0" />
              {t("createEvent.moderationBanner")}
            </p>
            <div className="mt-5">
              <CreateEventForm onCreated={setCreated} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
