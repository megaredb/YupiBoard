import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { useDeleteAccount } from "@/features/profile/hooks/use-delete-account";

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const [isConfirming, setConfirming] = useState(false);
  const { deleteAccount, isPending } = useDeleteAccount();
  const handleAskDelete = () => setConfirming(true);
  const handleCloseDialog = () => setConfirming(false);

  return (
    <Card size="lg" className="border-destructive/30">
      <Card.Header>
        <Card.Title size="lg">{t("profile.deleteAccount.title")}</Card.Title>
        <Card.Description>{t("profile.deleteAccount.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          type="button"
          variant="destructive"
          size="lg"
          isLoading={isPending}
          onClick={handleAskDelete}
        >
          <Trash2 aria-hidden />
          {t("profile.deleteAccount.action")}
        </Button>
      </Card.Content>
      {isConfirming && (
        <ConfirmDialog
          title={t("profile.deleteAccount.confirmTitle")}
          description={t("profile.deleteAccount.confirmDescription")}
          confirmLabel={t("profile.deleteAccount.confirm")}
          cancelLabel={t("common.cancel")}
          onConfirm={deleteAccount}
          onClose={handleCloseDialog}
        />
      )}
    </Card>
  );
}
