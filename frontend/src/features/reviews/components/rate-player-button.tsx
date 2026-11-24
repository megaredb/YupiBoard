import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { ReviewDialog } from "@/features/reviews/components/review-dialog";
import { useMyEventReviews } from "@/features/reviews/hooks/use-my-event-reviews";
import { useSubmitReview } from "@/features/reviews/hooks/use-submit-review";

interface RatePlayerButtonProps {
  eventId: string;
  playerId: string;
  playerName: string;
}

/** For the organizer: rate a player who attended, while the review window is open. */
export function RatePlayerButton({ eventId, playerId, playerName }: RatePlayerButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const reviews = useMyEventReviews(eventId, true);
  const review = useSubmitReview(eventId);

  if (!reviews.canReview) return null;

  const score = reviews.getPlayerScore(playerId);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleSubmit = (next: number) =>
    review.submit({ role: "player", userId: playerId }, next, handleClose);

  return (
    <>
      {score && (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star aria-hidden className="size-4 fill-rating text-rating" />
          {score}
        </span>
      )}
      <Button variant="secondary" size="lg" onClick={handleOpen}>
        {score ? t("reviews.playerEdit") : t("reviews.playerAction")}
      </Button>
      {isOpen && (
        <ReviewDialog
          title={t("reviews.dialog.playerTitle", { name: playerName })}
          initialScore={score}
          isSubmitting={review.isPending}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      )}
    </>
  );
}
