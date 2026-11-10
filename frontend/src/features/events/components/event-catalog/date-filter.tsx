import { useTranslation } from "react-i18next";
import { DateRangeField, type DateRange } from "@/shared/components/date-range-field";
import { getTodayIsoDate } from "@/shared/lib/date/iso-date";
import { Button } from "@/shared/ui/button";
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
  const hasDates = Boolean(range.from || range.to);

  const handleRangeChange = (next: DateRange) => onChange({ ...value, ...next });
  const handlePresetChange = (presets: string[]) => {
    const preset = presets[0];
    onChange({ ...value, ...(isDatePreset(preset) ? getDatePresetRange(preset) : NO_DATES) });
  };
  const handleClearDates = () => onChange({ ...value, ...NO_DATES });

  const clearAction = hasDates && (
    <Button variant="link" size="xs" className="px-0" onClick={handleClearDates}>
      {t("events.filters.anyDate")}
    </Button>
  );

  return (
    <FilterSection title={t("events.filters.date")} action={clearAction}>
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
        className="flex flex-wrap justify-center gap-1.5"
      >
        {DATE_PRESETS.map((preset) => (
          <ToggleGroup.Item
            key={preset}
            value={preset}
            className="h-auto min-h-8 px-2.5 py-1 text-center leading-tight whitespace-normal"
          >
            {t(PRESET_LABEL_KEYS[preset])}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup>
    </FilterSection>
  );
}
