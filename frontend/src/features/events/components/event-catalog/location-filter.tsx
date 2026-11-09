import { useId, type ChangeEvent } from "react";
import { LocateFixed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";
import { RangeSlider } from "@/shared/ui/range-slider";
import { FilterSection } from "@/features/events/components/event-catalog/filter-section";
import { useCityOptions } from "@/features/events/hooks/use-city-options";
import {
  DISTANCE_RANGE_KM,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

interface LocationFilterProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const { t } = useTranslation();
  const cityId = useId();
  const cityOptions = useCityOptions();

  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...value, city: event.target.value });
  const handleDistanceCommit = (distance: number) => onChange({ ...value, distance });
  const formatWithin = (km: number) => t("events.filters.within", { km });
  const formatBound = (km: number) => t("events.filters.km", { km });

  return (
    <FilterSection>
      <div className="space-y-2">
        <Label htmlFor={cityId} className="text-sm font-medium">
          {t("events.filters.location")}
        </Label>
        <NativeSelect
          id={cityId}
          variant="tinted"
          startIcon={<LocateFixed />}
          options={cityOptions}
          value={value.city}
          onChange={handleCityChange}
        />
        <p className="text-xs text-muted-foreground">{t("events.filters.fromCityCenter")}</p>
      </div>
      <RangeSlider
        key={value.distance}
        label={t("events.filters.distance")}
        formatValue={formatWithin}
        formatBound={formatBound}
        min={DISTANCE_RANGE_KM.min}
        max={DISTANCE_RANGE_KM.max}
        value={value.distance}
        onCommit={handleDistanceCommit}
      />
    </FilterSection>
  );
}
