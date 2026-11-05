import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

interface ProfileEditActionsProps {
  isPending: boolean;
  onCancel: () => void;
  onChangePassword: () => void;
}

export function ProfileEditActions({
  isPending,
  onCancel,
  onChangePassword,
}: ProfileEditActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{t("profile.fields.password")}</span>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onChangePassword}
          disabled={isPending}
          className="text-primary"
        >
          {t("profile.changePassword")}
        </Button>
      </div>
      <Separator />
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={isPending}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="lg" isLoading={isPending}>
          {t("profile.saveChanges")}
        </Button>
      </div>
    </>
  );
}
