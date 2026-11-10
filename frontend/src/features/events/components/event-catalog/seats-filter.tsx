import { useTranslation } from "react-i18next";
import { SwitchField } from "@/shared/components/switch-field";
import { formatDecimal } from "@/shared/lib/format/format-number";
import { RangeSlider } from "@/shared/ui/range-slider";
import { FilterSection } from "@/features/events/components/event-catalog/filter-section";
import {
  SEATS_FILTER_RANGE,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

interface SeatsFilterProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

export function SeatsFilter({ value, onChange }: SeatsFilterProps) {
  const { t } = useTranslation();
  const seatsCount = value.seats ?? SEATS_FILTER_RANGE.min;

  const handleToggle = (isChecked: boolean) =>
    onChange({ ...value, seats: isChecked ? seatsCount : undefined });
  const handleSeatsCommit = (seats: number) => onChange({ ...value, seats });
  const formatSeats = (count: number) => formatDecimal(count);
  const formatBound = (count: number) => formatDecimal(count);

  return (
    <FilterSection>
      <RangeSlider
        key={seatsCount}
        label={t("events.filters.seats")}
        formatValue={formatSeats}
        formatBound={formatBound}
        min={SEATS_FILTER_RANGE.min}
        max={SEATS_FILTER_RANGE.max}
        value={seatsCount}
        onCommit={handleSeatsCommit}
      />
      <SwitchField
        label={t("events.filters.withFreeSeats")}
        isChecked={value.seats !== undefined}
        onCheckedChange={handleToggle}
      />
    </FilterSection>
  );
}
