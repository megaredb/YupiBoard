import { useTranslation } from "react-i18next";
import { DateRangeField, type DateRange } from "@/shared/components/date-range-field";
import { getTodayIsoDate } from "@/shared/lib/date/iso-date";
import { ToggleGroup } from "@/shared/ui/toggle-group";
import { FilterSection } from "@/features/events/components/event-catalog/filter-section";
import {
  DATE_PRESETS,
  findDatePreset,
  getDatePresetRange,
  type DatePreset,
} from "@/features/events/lib/date-presets";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

interface DateFilterProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

const PRESET_LABEL_KEYS = {
  today: "events.filters.today",
  weekend: "events.filters.weekend",
  month: "events.filters.month",
} as const satisfies Record<DatePreset, string>;

const NO_DATES: DateRange = { from: undefined, to: undefined };

function isDatePreset(value: string | undefined): value is DatePreset {
  return DATE_PRESETS.some((preset) => preset === value);
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const { t } = useTranslation();
  const range: DateRange = { from: value.from, to: value.to };
  const activePreset = findDatePreset(range);

  const handleRangeChange = (next: DateRange) => onChange({ ...value, ...next });
  const handlePresetChange = (presets: string[]) => {
    const preset = presets[0];
    onChange({ ...value, ...(isDatePreset(preset) ? getDatePresetRange(preset) : NO_DATES) });
  };

  return (
    <FilterSection title={t("events.filters.date")}>
      <DateRangeField
        fromLabel={t("events.filters.dateFrom")}
        toLabel={t("events.filters.dateTo")}
        value={range}
        min={getTodayIsoDate()}
        onChange={handleRangeChange}
      />
      <ToggleGroup
        aria-label={t("events.filters.datePresets")}
        value={activePreset ? [activePreset] : []}
        onValueChange={handlePresetChange}
      >
        {DATE_PRESETS.map((preset) => (
          <ToggleGroup.Item key={preset} value={preset}>
            {t(PRESET_LABEL_KEYS[preset])}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup>
    </FilterSection>
  );
}
