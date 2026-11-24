import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { RatingPopover } from "@/features/reviews/components/rating-popover";
import { ScoreBadge } from "@/features/reviews/components/score-badge";
import { useMyEventReviews } from "@/features/reviews/hooks/use-my-event-reviews";

interface RatePlayerButtonProps {
  eventId: string;
  playerId: string;
  playerName: string;
  hasAttended: boolean;
}

export function RatePlayerButton({
  eventId,
  playerId,
  playerName,
  hasAttended,
}: RatePlayerButtonProps) {
  const { t } = useTranslation();
  const reviews = useMyEventReviews(eventId);
  const score = reviews.getPlayerScore(playerId);
  const label = t("reviews.player.rateLabel", { name: playerName });

  if (!hasAttended || !reviews.canReview) {
    return score ? (
      <ScoreBadge score={score} aria-label={label} disabled />
    ) : (
      <Button variant="ghost" size="lg" className="bg-muted text-muted-foreground" disabled>
        {t("reviews.player.action")}
      </Button>
    );
  }

  return (
    <RatingPopover
      eventId={eventId}
      target={{ role: "player", userId: playerId }}
      title={t("reviews.player.popoverTitle")}
      score={score}
      trigger={
        score ? (
          <ScoreBadge score={score} aria-label={label} />
        ) : (
          <Button size="lg" aria-label={label}>
            {t("reviews.player.action")}
          </Button>
        )
      }
    />
  );
}
