import { useTranslation } from "react-i18next";
import type { UserRead } from "@/shared/api/generated/model";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ProfileDetailsList } from "@/features/profile/components/profile-details-list";

interface ProfileDetailsProps {
  user: UserRead;
  onEdit: () => void;
  onChangePassword: () => void;
  className?: string;
}

export function ProfileDetails({ user, onEdit, onChangePassword, className }: ProfileDetailsProps) {
  const { t } = useTranslation();

  return (
    <Card size="lg" className={className}>
      <Card.Content>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">{t("profile.accountDetails")}</h2>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onEdit}
            className="text-primary"
          >
            {t("common.edit")}
          </Button>
        </div>
        <ProfileDetailsList user={user} onChangePassword={onChangePassword} />
      </Card.Content>
    </Card>
  );
}
