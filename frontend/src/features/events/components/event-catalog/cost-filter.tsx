import { useTranslation } from "react-i18next";
import { RangeField } from "@/shared/components/range-field";
import { SwitchField } from "@/shared/components/switch-field";
import { getCurrencySymbol } from "@/shared/lib/format/format-number";
import { FilterSection } from "@/features/events/components/event-catalog/filter-section";
import { getCatalogCurrency } from "@/features/events/lib/event-currency";
import { COST_RANGE, type CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

interface CostFilterProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

/** "Free only" is a maximum cost of zero; a slider end means "no limit" on that side. */
export function CostFilter({ value, onChange }: CostFilterProps) {
  const { t } = useTranslation();
  const isFreeOnly = value.costMax === 0;
  const low = value.costMin ?? COST_RANGE.min;
  const high = value.costMax ?? COST_RANGE.max;
  const rangeKey = [low, high].join("-");

  const handleFreeOnlyChange = (isChecked: boolean) =>
    onChange({ ...value, costMin: undefined, costMax: isChecked ? 0 : undefined });
  const handleRangeCommit = ([min, max]: readonly [number, number]) =>
    onChange({
      ...value,
      costMin: min === COST_RANGE.min ? undefined : min,
      costMax: max === COST_RANGE.max ? undefined : max,
    });

  return (
    <FilterSection>
      {!isFreeOnly && (
        <RangeField
          key={rangeKey}
          label={t("events.filters.cost")}
          boundLabels={[t("events.filters.costMin"), t("events.filters.costMax")]}
          min={COST_RANGE.min}
          max={COST_RANGE.max}
          step={COST_RANGE.step}
          value={[low, high]}
          prefix={getCurrencySymbol(getCatalogCurrency())}
          onCommit={handleRangeCommit}
        />
      )}
      <SwitchField
        label={t("events.filters.freeOnly")}
        isChecked={isFreeOnly}
        onCheckedChange={handleFreeOnlyChange}
      />
    </FilterSection>
  );
}
