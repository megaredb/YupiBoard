import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormField } from "@/shared/components/form-field"
import { useFieldError } from "@/shared/i18n/use-field-error"
import { Input } from "@/shared/ui/input"
import { NumberStepper } from "@/shared/ui/number-stepper"
import { FormSection } from "@/features/events/components/create-event/form-section"
import { useCreateEventFormContext } from "@/features/events/hooks/use-create-event-form-context"
import { CREATE_EVENT_LIMITS } from "@/features/events/schemas/create-event.schema"

/** "Players & price": seat count and entry cost. */
export function PlayersSection() {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const {
    register,
    control,
    formState: { errors },
  } = useCreateEventFormContext()

  return (
    <FormSection title={t("events.create.players.title")}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t("events.create.fields.seats")}
          isRequired
          hint={t("events.create.fields.seatsHint", {
            min: CREATE_EVENT_LIMITS.playersMin,
            max: CREATE_EVENT_LIMITS.playersMax,
          })}
        >
          {(fieldControl) => (
            <Controller
              control={control}
              name="maxPlayers"
              render={({ field }) => (
                <NumberStepper
                  {...fieldControl}
                  value={field.value}
                  onChange={field.onChange}
                  min={CREATE_EVENT_LIMITS.playersMin}
                  max={CREATE_EVENT_LIMITS.playersMax}
                  decreaseLabel={t("events.create.fields.seatsDecrease")}
                  increaseLabel={t("events.create.fields.seatsIncrease")}
                />
              )}
            />
          )}
        </FormField>

        <FormField
          label={t("events.create.fields.price")}
          hint={t("events.create.fields.priceHint")}
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
            />
          )}
        </FormField>
      </div>
    </FormSection>
  )
}
