import { useState, type ReactElement } from "react";
import { Popover } from "@/shared/ui/popover";
import { ScoreChips } from "@/features/reviews/components/score-chips";
import { useSubmitReview, type ReviewTarget } from "@/features/reviews/hooks/use-submit-review";

interface RatingPopoverProps {
  eventId: string;
  target: ReviewTarget;
  title: string;
  score: number | null;
  trigger: ReactElement;
}

export function RatingPopover({ eventId, target, title, score, trigger }: RatingPopoverProps) {
  const [isOpen, setOpen] = useState(false);
  const review = useSubmitReview(eventId);
  const handleClose = () => setOpen(false);
  const handleSelect = (next: number) => review.submit(target, next, handleClose);

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <Popover.Trigger render={trigger} />
      <Popover.Content align="center" className="w-auto space-y-3 p-4">
        <p className="text-center text-sm font-medium text-foreground">{title}</p>
        <ScoreChips
          label={title}
          value={score}
          isDisabled={review.isPending}
          onSelect={handleSelect}
        />
      </Popover.Content>
    </Popover>
  );
}
