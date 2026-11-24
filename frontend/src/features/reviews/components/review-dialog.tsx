import { useState } from "react";
import { useTranslation } from "react-i18next";
import { InlineError } from "@/shared/components/inline-error";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { StarRatingInput } from "@/features/reviews/components/star-rating-input";

interface ReviewDialogProps {
  title: string;
  initialScore: number | null;
  isSubmitting: boolean;
  onSubmit: (score: number) => void;
  onClose: () => void;
}

export function ReviewDialog({
  title,
  initialScore,
  isSubmitting,
  onSubmit,
  onClose,
}: ReviewDialogProps) {
  const { t } = useTranslation();
  const [score, setScore] = useState(initialScore ?? 0);
  const [hasError, setHasError] = useState(false);

  const handleChange = (next: number) => {
    setScore(next);
    setHasError(false);
  };
  const handleSubmit = () => {
    if (score < 1) setHasError(true);
    else onSubmit(score);
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Content closeLabel={t("common.close")}>
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{t("reviews.dialog.description")}</Dialog.Description>
        </Dialog.Header>
        <StarRatingInput
          label={t("reviews.dialog.ratingLabel")}
          value={score}
          onChange={handleChange}
        />
        {hasError && <InlineError message={t("reviews.dialog.scoreRequired")} />}
        <Dialog.Footer>
          <Button variant="secondary" size="lg" disabled={isSubmitting} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button size="lg" isLoading={isSubmitting} onClick={handleSubmit}>
            {t("reviews.dialog.submit")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
