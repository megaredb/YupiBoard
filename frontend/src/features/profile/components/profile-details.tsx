import { useTranslation } from "react-i18next";
import type { UserRead } from "@/shared/api/generated/model";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DetailsRow } from "@/features/profile/components/details-row";

interface ProfileDetailsProps {
  user: UserRead;
  bio: string;
  onEdit: () => void;
  onChangePassword: () => void;
}

/** View mode of "My profile" (ORG-5). */
export function ProfileDetails({ user, bio, onEdit, onChangePassword }: ProfileDetailsProps) {
  const { t } = useTranslation();
  const dash = t("common.notProvided");

  return (
    <Card className="rounded-2xl p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{t("profile.accountDetails")}</h2>
        <Button type="button" variant="outline" size="lg" onClick={onEdit} className="text-primary">
          {t("common.edit")}
        </Button>
      </div>

      <dl className="mt-2 divide-y divide-border text-sm">
        <DetailsRow label={t("profile.fields.firstName")}>{user.first_name || dash}</DetailsRow>
        <DetailsRow label={t("profile.fields.lastName")}>{user.last_name || dash}</DetailsRow>
        <DetailsRow label={t("profile.fields.bio")} note={t("profile.deviceOnlyNote")}>
          {bio || dash}
        </DetailsRow>
        <DetailsRow label={t("profile.fields.contactInfo")} note={t("common.optional")}>
          {user.contact_info || dash}
        </DetailsRow>
        <DetailsRow label={t("profile.fields.email")}>
          <span className="flex flex-wrap items-center gap-2">
            {user.email}
            <Badge variant="muted" className="font-normal">
              {t("common.readOnly")}
            </Badge>
          </span>
        </DetailsRow>
        <DetailsRow label={t("profile.fields.location")} note={t("profile.locationHint")}>
          {user.city || dash}
        </DetailsRow>
        <DetailsRow label={t("profile.fields.password")}>
          <span className="flex items-center justify-between gap-4">
            <span className="tracking-widest">{t("profile.passwordMasked")}</span>
            <Button type="button" variant="link" size="sm" onClick={onChangePassword}>
              {t("profile.changePassword")}
            </Button>
          </span>
        </DetailsRow>
      </dl>
    </Card>
  );
}
