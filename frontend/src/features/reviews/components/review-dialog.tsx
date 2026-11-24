import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { InlineError } from "@/shared/components/inline-error";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { StarRatingInput } from "@/features/reviews/components/star-rating-input";
import { reviewSchema, type ReviewFormValues } from "@/features/reviews/schemas/review.schema";

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
  const fieldError = useFieldError();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useAppForm(reviewSchema, { defaultValues: { score: initialScore ?? 0 } });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  const handleSaveRating = ({ score }: ReviewFormValues) => onSubmit(score);
  const scoreError = fieldError(errors.score?.message);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content closeLabel={t("common.close")}>
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{t("reviews.dialog.description")}</Dialog.Description>
        </Dialog.Header>
        <form noValidate className="space-y-4" onSubmit={handleSubmit(handleSaveRating)}>
          <Controller
            control={control}
            name="score"
            render={({ field }) => (
              <StarRatingInput
                label={t("reviews.dialog.ratingLabel")}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {scoreError && <InlineError message={scoreError} />}
          <Dialog.Footer>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="lg" isLoading={isSubmitting}>
              {t("reviews.dialog.submit")}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
