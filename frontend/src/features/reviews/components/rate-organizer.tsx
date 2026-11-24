import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { RatingPopover } from "@/features/reviews/components/rating-popover";
import { ScoreBadge } from "@/features/reviews/components/score-badge";
import { useMyEventReviews } from "@/features/reviews/hooks/use-my-event-reviews";

interface RateOrganizerProps {
  eventId: string;
  hasAttended: boolean;
  showCaption?: boolean;
  className?: string;
}

export function RateOrganizer({
  eventId,
  hasAttended,
  showCaption = true,
  className,
}: RateOrganizerProps) {
  const { t } = useTranslation();
  const reviews = useMyEventReviews(eventId);
  const score = reviews.organizerScore;
  const isEditable = hasAttended && reviews.canReview;

  if (score) {
    const badge = (
      <ScoreBadge
        score={score}
        aria-label={t("reviews.organizer.yourRating")}
        disabled={!isEditable}
        className="w-full"
      />
    );
    return (
      <div className={cn("space-y-2", className)}>
        {showCaption && (
          <p className="text-sm text-foreground">{t("reviews.organizer.yourRating")}</p>
        )}
        {isEditable ? (
          <RatingPopover
            eventId={eventId}
            target={{ role: "organizer" }}
            title={t("reviews.organizer.popoverTitle")}
            score={score}
            trigger={badge}
          />
        ) : (
          badge
        )}
      </div>
    );
  }

  const button = (
    <Button
      size="xl"
      variant={isEditable ? "default" : "ghost"}
      disabled={!isEditable}
      className={cn("w-full text-sm", !isEditable && "bg-muted text-muted-foreground", className)}
    >
      {t("reviews.organizer.action")}
    </Button>
  );
  if (!isEditable) return button;

  return (
    <RatingPopover
      eventId={eventId}
      target={{ role: "organizer" }}
      title={t("reviews.organizer.popoverTitle")}
      score={null}
      trigger={button}
    />
  );
}
