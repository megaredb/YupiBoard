import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDecimal } from "@/shared/lib/format/format-number";
import { ToggleGroup } from "@/shared/ui/toggle-group";
import { FilterSection } from "@/features/events/components/event-catalog/filter-section";
import {
  ORGANIZER_RATINGS,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

interface RatingFilterProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  const { t } = useTranslation();
  const selected = value.rating === undefined ? [] : [String(value.rating)];

  const handleChange = (ratings: string[]) => {
    const rating = Number(ratings[0]);
    onChange({ ...value, rating: Number.isInteger(rating) && rating > 0 ? rating : undefined });
  };

  return (
    <FilterSection title={t("events.filters.rating")}>
      <ToggleGroup
        aria-label={t("events.filters.rating")}
        value={selected}
        onValueChange={handleChange}
        className="flex-nowrap gap-1.5"
      >
        {ORGANIZER_RATINGS.map((rating) => (
          <ToggleGroup.Item
            key={rating}
            value={String(rating)}
            aria-label={t("events.filters.ratingOption", { count: rating })}
            className="group flex-1 bg-card px-1 aria-pressed:border-primary/30 aria-pressed:bg-primary/10 aria-pressed:text-primary"
          >
            <span aria-hidden>{formatDecimal(rating)}</span>
            <Star
              aria-hidden
              className="text-rating transition-colors group-aria-pressed:text-primary"
            />
          </ToggleGroup.Item>
        ))}
      </ToggleGroup>
      {value.rating !== undefined && (
        <p className="text-xs text-muted-foreground">
          {t("events.filters.ratingOption", { count: value.rating })}
        </p>
      )}
    </FilterSection>
  );
}
