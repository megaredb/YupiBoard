import { useId } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

const SCORES = [1, 2, 3, 4, 5] as const;

interface StarRatingInputProps {
  label: string;
  value: number;
  onChange: (score: number) => void;
}

/** Five native radios (keyboard and screen-reader friendly): the n-th star fills every star up to it. */
export function StarRatingInput({ label, value, onChange }: StarRatingInputProps) {
  const { t } = useTranslation();
  const name = useId();

  return (
    <fieldset className="flex items-center justify-center gap-1">
      <legend className="sr-only">{label}</legend>
      {SCORES.map((score) => (
        <label
          key={score}
          className="touch-hitbox cursor-pointer rounded-lg p-1 has-focus-visible:ring-2 has-focus-visible:ring-ring/50"
        >
          <input
            type="radio"
            name={name}
            value={score}
            checked={score === value}
            onChange={() => onChange(score)}
            className="sr-only"
          />
          <span className="sr-only">{t("reviews.stars", { count: score })}</span>
          <Star
            aria-hidden
            className={cn(
              "size-9 transition-colors",
              score <= value ? "fill-rating text-rating" : "text-muted-foreground/40",
            )}
          />
        </label>
      ))}
    </fieldset>
  );
}
