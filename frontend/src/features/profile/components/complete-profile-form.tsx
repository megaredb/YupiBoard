import { MapPin } from "lucide-react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UserRead } from "@/shared/api/generated/model"
import { TextField } from "@/shared/components/text-field"
import { useAppForm } from "@/shared/hooks/use-app-form"
import { useFieldError } from "@/shared/i18n/use-field-error"
import { applyServerFieldErrors } from "@/shared/lib/form/apply-server-field-errors"
import { CITY_MAX_LENGTH } from "@/shared/lib/validators/city"
import { CONTACT_INFO_MAX_LENGTH } from "@/shared/lib/validators/contact-info"
import { Button } from "@/shared/ui/button"
import { PersonNameFields } from "@/features/profile/components/person-name-fields"
import {
  completeProfileSchema,
  type CompleteProfileFormValues,
} from "@/features/profile/schemas/profile.schema"

interface CompleteProfileFormProps {
  user: UserRead
  isPending: boolean
  onSubmit: (values: CompleteProfileFormValues, onError: (error: unknown) => void) => void
}

const SERVER_FIELDS = ["first_name", "last_name", "city", "contact_info"] as const

export function CompleteProfileForm({ user, isPending, onSubmit }: CompleteProfileFormProps) {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const form = useAppForm(completeProfileSchema, {
    defaultValues: {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      city: user.city ?? "",
      contact_info: user.contact_info ?? "",
    },
  })
  const { errors } = form.formState
  const submit = form.handleSubmit((values) =>
    onSubmit(values, (error) => applyServerFieldErrors(error, SERVER_FIELDS, form.setError)),
  )

  return (
    <FormProvider {...form}>
      <form noValidate className="space-y-4" onSubmit={submit}>
        <PersonNameFields isPending={isPending} className="grid grid-cols-1 gap-4 sm:grid-cols-2" />
        <TextField
          label={t("profile.fields.city")}
          autoComplete="address-level2"
          maxLength={CITY_MAX_LENGTH}
          startIcon={<MapPin />}
          error={fieldError(errors.city?.message)}
          disabled={isPending}
          {...form.register("city")}
        />
        <TextField
          label={t("profile.fields.contacts")}
          optionalText={t("common.optional")}
          autoComplete="tel"
          maxLength={CONTACT_INFO_MAX_LENGTH}
          error={fieldError(errors.contact_info?.message)}
          disabled={isPending}
          {...form.register("contact_info")}
        />
        <Button type="submit" size="xl" className="mt-2 w-full text-sm" isLoading={isPending}>
          {t("profile.complete.submit")}
        </Button>
      </form>
    </FormProvider>
  )
}
