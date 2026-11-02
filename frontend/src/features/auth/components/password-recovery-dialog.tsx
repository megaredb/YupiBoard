import { useTranslation } from "react-i18next"
import { FormAlert } from "@/shared/components/form-alert"
import { TextField } from "@/shared/components/text-field"
import { useAppForm } from "@/shared/hooks/use-app-form"
import { useFieldError } from "@/shared/i18n/use-field-error"
import type { TranslationKey } from "@/shared/i18n/translation-key"
import { Button } from "@/shared/ui/button"
import { Dialog } from "@/shared/ui/dialog"
import {
  passwordRecoverySchema,
  type PasswordRecoveryFormValues,
} from "@/features/auth/schemas/password-recovery.schema"

interface PasswordRecoveryDialogProps {
  isOpen: boolean
  onClose: () => void
  isPending: boolean
  isSent: boolean
  errorKey: TranslationKey | null
  onSubmit: (values: PasswordRecoveryFormValues) => void
}

/** Mounted only while open, so every opening starts with an empty form. */
export function PasswordRecoveryDialog({
  isOpen,
  onClose,
  isPending,
  isSent,
  errorKey,
  onSubmit,
}: PasswordRecoveryDialogProps) {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useAppForm(passwordRecoverySchema, { defaultValues: { email: "" } })
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Content closeLabel={t("common.close")}>
        <Dialog.Header>
          <Dialog.Title>
            {t(isSent ? "auth.recovery.sentTitle" : "auth.recovery.title")}
          </Dialog.Title>
          <Dialog.Description>
            {t(isSent ? "auth.recovery.sentMessage" : "auth.recovery.description")}
          </Dialog.Description>
        </Dialog.Header>

        {isSent ? (
          <Dialog.Footer>
            <Button onClick={onClose}>{t("common.close")}</Button>
          </Dialog.Footer>
        ) : (
          <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errorKey && <FormAlert message={t(errorKey)} />}
            <TextField
              label={t("auth.fields.email")}
              type="email"
              autoComplete="email"
              placeholder={t("auth.fields.emailPlaceholder")}
              error={fieldError(errors.email?.message)}
              disabled={isPending}
              {...register("email")}
            />
            <Dialog.Footer>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" isLoading={isPending}>
                {t("auth.recovery.submit")}
              </Button>
            </Dialog.Footer>
          </form>
        )}
      </Dialog.Content>
    </Dialog>
  )
}
