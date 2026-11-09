import type { ReactNode } from "react";
import { MapPin, Shield, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserPublicRead } from "@/shared/api/generated/model";
import { Card } from "@/shared/ui/card";
import { RatingTile } from "@/features/profile/components/rating-tile";
import { formatMemberSince, formatRating } from "@/features/users";

interface ProfileSummaryCardProps {
  user: UserPublicRead;
  name: string;
  /** Plain avatar, or the avatar picker while editing. */
  avatar: ReactNode;
  showCity?: boolean;
}

export function ProfileSummaryCard({
  user,
  name,
  avatar,
  showCity = false,
}: ProfileSummaryCardProps) {
  const { t } = useTranslation();
  const memberSince = formatMemberSince(user.created_at);

  return (
    <Card className="relative z-10 rounded-2xl p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {avatar}
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{name}</h1>
            {showCity && user.city && (
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                <span>{user.city}</span>
              </p>
            )}
            {memberSince && (
              <p className="text-xs text-muted-foreground">
                {t("profile.memberSince", { date: memberSince })}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <RatingTile
            label={t("profile.playerRating")}
            icon={<Star aria-hidden className="size-4 fill-rating text-rating" />}
            rating={formatRating(user.rating_as_player)}
          />
          <RatingTile
            label={t("profile.organizerRating")}
            icon={<Shield aria-hidden className="size-4 text-primary" />}
            rating={formatRating(user.rating_as_organizer)}
          />
        </div>
      </div>
    </Card>
  );
}
