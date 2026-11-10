import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BookingParticipantSummary } from "@/shared/api/generated/model";
import { formatMonthYear } from "@/shared/lib/format/format-date";
import { formatRating, getFullName, UserAvatar } from "@/features/users";

interface ParticipantRowProps {
  participant: BookingParticipantSummary;
  aside?: ReactNode;
}

export function ParticipantRow({ participant, aside }: ParticipantRowProps) {
  const { t } = useTranslation();
  const name = getFullName(participant) ?? t("events.participants.unnamed");
  const rating = formatRating(participant.rating_as_player);
  const memberSince = participant.created_at ? formatMonthYear(participant.created_at) : null;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={name} avatarUrl={participant.avatar_url} className="size-11" />
        <div className="min-w-0 space-y-0.5">
          <Link
            to="/users/$userId"
            params={{ userId: participant.id }}
            search={{ page: 1 }}
            className="block truncate rounded-sm text-sm font-medium text-foreground hover:underline"
          >
            {name}
          </Link>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {rating ? (
              <>
                <Star aria-hidden className="size-3 fill-rating text-rating" />
                <span>{t("events.participants.playerRating", { rating })}</span>
              </>
            ) : (
              <span>{t("events.participants.noRating")}</span>
            )}
          </p>
          {memberSince && (
            <p className="text-xs text-muted-foreground">
              {t("events.details.memberSince", { date: memberSince })}
            </p>
          )}
        </div>
      </div>
      {aside && <div className="flex shrink-0 items-center gap-3 sm:justify-end">{aside}</div>}
    </li>
  );
}
