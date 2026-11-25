import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";

interface SetPasswordDialogProps {
  email: string;
  onClose: () => void;
  onSendLink: (email: string) => void;
  isPending: boolean;
  sentTo: string | null;
  errorKey: TranslationKey | null;
}

/** For accounts created with Google: there is no current password to ask for. */
export function SetPasswordDialog({
  email,
  onClose,
  onSendLink,
  isPending,
  sentTo,
  errorKey,
}: SetPasswordDialogProps) {
  const { t } = useTranslation();
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const handleSendLink = () => onSendLink(email);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content closeLabel={t("common.close")}>
        <Dialog.Header>
          <Dialog.Title>{t("profile.setPasswordDialog.title")}</Dialog.Title>
          <Dialog.Description>{t("profile.setPasswordDialog.description")}</Dialog.Description>
        </Dialog.Header>
        {errorKey && <FormAlert message={t(errorKey)} />}
        {sentTo && (
          <p className="text-sm text-muted-foreground">
            {t("profile.setPasswordDialog.sentMessage")}{" "}
            <span className="font-medium break-all text-foreground">{sentTo}</span>
          </p>
        )}
        <Dialog.Footer className="pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            {t("common.close")}
          </Button>
          <Button type="button" isLoading={isPending} onClick={handleSendLink}>
            {sentTo ? t("auth.recovery.resend") : t("profile.setPasswordDialog.submit")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
