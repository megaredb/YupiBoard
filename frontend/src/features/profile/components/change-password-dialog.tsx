import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import type { ChangePasswordFormValues } from "@/features/profile/schemas/change-password.schema";

interface ChangePasswordDialogProps {
  onClose: () => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
  onSubmit: (values: ChangePasswordFormValues) => void;
}

/** Mounted only while open, so the form always starts empty. */
export function ChangePasswordDialog({
  onClose,
  isPending,
  errorKey,
  onSubmit,
}: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content closeLabel={t("common.close")}>
        <Dialog.Header>
          <Dialog.Title>{t("profile.passwordDialog.title")}</Dialog.Title>
          <Dialog.Description>{t("profile.passwordDialog.description")}</Dialog.Description>
        </Dialog.Header>
        {errorKey && <FormAlert message={t(errorKey)} />}
        <ChangePasswordForm
          isPending={isPending}
          onSubmit={onSubmit}
          actions={
            <Dialog.Footer className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" isLoading={isPending}>
                {t("profile.passwordDialog.submit")}
              </Button>
            </Dialog.Footer>
          }
        />
      </Dialog.Content>
    </Dialog>
  );
}
