import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { REVIEW_SCORES } from "@/features/reviews/lib/review-scores";

interface ScoreChipsProps {
  label: string;
  value: number | null;
  isDisabled: boolean;
  onSelect: (score: number) => void;
}

export function ScoreChips({ label, value, isDisabled, onSelect }: ScoreChipsProps) {
  const { t } = useTranslation();

  return (
    <fieldset className="flex justify-center gap-2">
      <legend className="sr-only">{label}</legend>
      {REVIEW_SCORES.map((score) => (
        <button
          key={score}
          type="button"
          aria-pressed={score === value}
          aria-label={t("reviews.stars", { count: score })}
          disabled={isDisabled}
          onClick={() => onSelect(score)}
          className={cn(
            "touch-hitbox relative flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-sm font-medium transition-colors outline-none hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
            score === value && "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          {score}
          <Star aria-hidden className="size-3.5 fill-rating/20 text-rating" />
        </button>
      ))}
    </fieldset>
  );
}
