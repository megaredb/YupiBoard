import { useTranslation } from "react-i18next";
import type { UserRead } from "@/shared/api/generated/model";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { ProfileDetailsList } from "@/features/profile/components/profile-details-list";

interface MobileAccountDetailsSheetProps {
  user: UserRead;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onChangePassword: () => void;
}

/** Phone counterpart of `ProfileDetails`, opened from the profile shortcuts. */
export function MobileAccountDetailsSheet({
  user,
  isOpen,
  onOpenChange,
  onEdit,
  onChangePassword,
}: MobileAccountDetailsSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={onOpenChange}
      title={t("profile.accountDetails")}
      closeLabel={t("common.close")}
    >
      <div className="space-y-4">
        <ProfileDetailsList user={user} onChangePassword={onChangePassword} />
        <Button type="button" size="xl" className="w-full" onClick={onEdit}>
          {t("profile.editProfile")}
        </Button>
      </div>
    </BottomSheet>
  );
}
