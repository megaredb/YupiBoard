import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatShortDateTime } from "@/shared/lib/format/format-date";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ReviewDialog } from "@/features/reviews/components/review-dialog";
import { useMyEventReviews } from "@/features/reviews/hooks/use-my-event-reviews";
import { useSubmitReview } from "@/features/reviews/hooks/use-submit-review";

interface RateOrganizerCardProps {
  eventId: string;
}

/** For a player who attended: rate the organizer while the review window is open. */
export function RateOrganizerCard({ eventId }: RateOrganizerCardProps) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const reviews = useMyEventReviews(eventId);
  const review = useSubmitReview(eventId);

  if (!reviews.canReview) return null;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleSubmit = (score: number) => review.submit({ role: "organizer" }, score, handleClose);
  const { organizerScore, reviewDeadline } = reviews;

  return (
    <Card size="lg">
      <Card.Header>
        <Card.Title size="xl">{t("reviews.organizerCard.title")}</Card.Title>
        <Card.Description>
          {reviewDeadline
            ? t("reviews.organizerCard.description", {
                deadline: formatShortDateTime(reviewDeadline),
              })
            : t("reviews.organizerCard.descriptionNoDeadline")}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={handleOpen}>
          {organizerScore ? t("reviews.organizerCard.edit") : t("reviews.organizerCard.action")}
        </Button>
        {organizerScore && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star aria-hidden className="size-4 fill-rating text-rating" />
            {t("reviews.yourRating", { score: organizerScore })}
          </span>
        )}
      </Card.Content>
      {isOpen && (
        <ReviewDialog
          title={t("reviews.dialog.organizerTitle")}
          initialScore={organizerScore}
          isSubmitting={review.isPending}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      )}
    </Card>
  );
}
