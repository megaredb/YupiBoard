import type { ChangeEvent } from "react";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import type { Coordinates } from "@/shared/platform/geolocation";
import { RangeSlider } from "@/shared/ui/range-slider";
import { FilterSection } from "@/features/events/components/event-catalog/filter-section";
import { MyLocationChip } from "@/features/events/components/event-catalog/my-location-chip";
import { toCityCenter, toMyLocation } from "@/features/events/lib/to-my-location";
import {
  DISTANCE_RANGE_KM,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";
import { CitySelect, MyLocationButton } from "@/features/locations";

interface LocationFilterProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const { t } = useTranslation();
  const { lat, lon } = value;

  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange(toCityCenter(value, event.target.value));
  const handleMyLocation = (position: Coordinates) => onChange(toMyLocation(value, position));
  const handleBackToCity = () => onChange(toCityCenter(value));
  const handleDistanceCommit = (distance: number) => onChange({ ...value, distance });
  const formatWithin = (km: number) => t("events.filters.within", { km });
  const formatBound = (km: number) => t("events.filters.km", { km });

  return (
    <FilterSection>
      {lat !== undefined && lon !== undefined ? (
        <div className="space-y-2">
          <p className="text-sm text-foreground">{t("events.filters.location")}</p>
          <MyLocationChip lat={lat} lon={lon} onDismiss={handleBackToCity} />
          <p className="text-xs text-muted-foreground">{t("events.filters.fromMyLocation")}</p>
        </div>
      ) : (
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
      )}
      <MyLocationButton onFound={handleMyLocation} />
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
