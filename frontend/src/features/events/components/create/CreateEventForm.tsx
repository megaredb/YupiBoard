import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useGoBack } from "@/hooks/useGoBack"
import { getErrorMessage } from "@/lib/errors"
import { useCreateEvent } from "../../api"
import { CREATE_EVENT_LIMITS as LIMITS } from "../../constants"
import { createEventSchema, type CreateEventFormValues } from "./createEventSchema"
import { CreateEventFields } from "./CreateEventFields"

export function CreateEventForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const goBack = useGoBack("/events")
  const createEvent = useCreateEvent()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateEventFormValues>({
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
  const { handleSubmit } = form

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
      <CreateEventFields form={form} />

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
