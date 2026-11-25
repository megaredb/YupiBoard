import { useTranslation } from "react-i18next";
import type { UserRead } from "@/shared/api/generated/model";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useCityLabel } from "@/features/locations";
import { DetailsRow } from "@/features/profile/components/details-row";

interface ProfileDetailsListProps {
  user: UserRead;
  onChangePassword: () => void;
}

/** The account fields, shared by the desktop card and the phone sheet. */
export function ProfileDetailsList({ user, onChangePassword }: ProfileDetailsListProps) {
  const { t } = useTranslation();
  const dash = t("common.notProvided");
  const cityLabel = useCityLabel(user.city);

  return (
    <dl className="divide-y divide-border text-sm">
      <DetailsRow label={t("profile.fields.firstName")}>{user.first_name || dash}</DetailsRow>
      <DetailsRow label={t("profile.fields.lastName")}>{user.last_name || dash}</DetailsRow>
      <DetailsRow label={t("profile.fields.bio")} note={t("common.optional")}>
        {user.bio || dash}
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
        {cityLabel || dash}
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
  );
}
