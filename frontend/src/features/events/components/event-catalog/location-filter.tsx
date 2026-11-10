import type { ChangeEvent } from "react";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CityRead } from "@/shared/api/generated/model";
import { FormField } from "@/shared/components/form-field";
import { RangeSlider } from "@/shared/ui/range-slider";
import { FilterSection } from "@/features/events/components/event-catalog/filter-section";
import {
  DISTANCE_RANGE_KM,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";
import { CitySelect, NearestCityButton } from "@/features/locations";

interface LocationFilterProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const { t } = useTranslation();

  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...value, city: event.target.value });
  const handleNearestCity = (city: CityRead) => onChange({ ...value, city: city.name });
  const handleDistanceCommit = (distance: number) => onChange({ ...value, distance });
  const formatWithin = (km: number) => t("events.filters.within", { km });
  const formatBound = (km: number) => t("events.filters.km", { km });

  return (
    <FilterSection>
      <FormField label={t("events.filters.location")} hint={t("events.filters.fromCityCenter")}>
        {(fieldControl) => (
          <CitySelect
            {...fieldControl}
            variant="tinted"
            startIcon={<MapPin />}
            value={value.city}
            onChange={handleCityChange}
          />
        )}
      </FormField>
      <NearestCityButton onFound={handleNearestCity} />
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
