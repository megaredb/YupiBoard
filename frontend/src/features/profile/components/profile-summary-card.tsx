import type { ReactNode } from "react";
import { MapPin, Shield, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserPublicRead } from "@/shared/api/generated/model";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { useCityLabel } from "@/features/locations";
import { RatingTile } from "@/features/profile/components/rating-tile";
import { formatMemberSince, formatRating } from "@/features/users";

interface ProfileSummaryCardProps {
  user: UserPublicRead;
  name: string;
  avatar: ReactNode;
  showCity?: boolean;
}

function PublicProfileMiddleColumn({ user }: { user: UserPublicRead }) {
  const { t } = useTranslation();
  const notProvided = t("common.notProvided");

  return (
    <div className="space-y-2.5 text-center sm:text-left desktop:col-span-4">
      <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {user.bio ?? notProvided}
      </p>
      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
        {user.contact_info ?? notProvided}
      </Badge>
    </div>
  );
}

export function ProfileSummaryCard({
  user,
  name,
  avatar,
  showCity = false,
}: ProfileSummaryCardProps) {
  const { t } = useTranslation();
  const cityLabel = useCityLabel(user.city);
  const memberSince = formatMemberSince(user.created_at);

  return (
    <Card size="lg" className="relative z-10">
      <Card.Content>
        <div
          className={cn(
            showCity
              ? "grid grid-cols-1 items-center gap-6 desktop:grid-cols-12"
              : "flex flex-col justify-between gap-5 sm:flex-row sm:items-center",
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center gap-4 sm:flex-row",
              showCity && "desktop:col-span-4",
            )}
          >
            {avatar}
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {name}
              </h1>
              {showCity && (
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin aria-hidden className="size-3.5 shrink-0" />
                  <span>{cityLabel ?? t("common.notProvided")}</span>
                </p>
              )}
              {memberSince && (
                <p className="text-xs text-muted-foreground">
                  {t("profile.memberSince", { date: memberSince })}
                </p>
              )}
            </div>
          </div>

          {showCity && <PublicProfileMiddleColumn user={user} />}

          <div
            className={cn("grid grid-cols-2 gap-3", showCity ? "desktop:col-span-4" : "sm:flex")}
          >
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
      </Card.Content>
    </Card>
  );
}
