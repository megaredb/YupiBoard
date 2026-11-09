import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { TextField } from "@/shared/components/text-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { PasswordRecoverySent } from "@/features/auth/components/password-recovery-sent";
import {
  passwordRecoverySchema,
  type PasswordRecoveryFormValues,
} from "@/features/auth/schemas/password-recovery.schema";

interface PasswordRecoveryDialogProps {
  onClose: () => void;
  isPending: boolean;
  /** The address the link went to; `null` while the form is shown. */
  sentTo: string | null;
  errorKey: TranslationKey | null;
  onSubmit: (values: PasswordRecoveryFormValues) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}

/** Mounted only while open, so every opening starts with an empty form. */
export function PasswordRecoveryDialog({
  onClose,
  isPending,
  sentTo,
  errorKey,
  onSubmit,
  onResend,
  onChangeEmail,
}: PasswordRecoveryDialogProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  // Kept above the "sent" view, so "use a different email" returns to the address typed before.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useAppForm(passwordRecoverySchema, { defaultValues: { email: "" } });
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content closeLabel={t("common.close")}>
        {sentTo ? (
          <PasswordRecoverySent
            email={sentTo}
            isPending={isPending}
            errorKey={errorKey}
            onResend={onResend}
            onChangeEmail={onChangeEmail}
            onClose={onClose}
          />
        ) : (
          <>
            <Dialog.Header>
              <Dialog.Title>{t("auth.recovery.title")}</Dialog.Title>
              <Dialog.Description>{t("auth.recovery.description")}</Dialog.Description>
            </Dialog.Header>
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
          </>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
