import { MapPin, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/ui/button";
import { MyLocationChip } from "@/features/events/components/event-catalog/my-location-chip";
import { toCityCenter } from "@/features/events/lib/to-my-location";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";
import { CityCombobox } from "@/features/locations";

interface MobileCatalogToolbarProps {
  value: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
  onOpenFilters: () => void;
}

export function MobileCatalogToolbar({ value, onApply, onOpenFilters }: MobileCatalogToolbarProps) {
  const { t } = useTranslation();
  const { lat, lon } = value;
  const handleCityChange = (city: string) => onApply(toCityCenter(value, city));
  const handleBackToCity = () => onApply(toCityCenter(value));

  return (
    <div className="flex items-center justify-between gap-3 desktop:hidden">
      {lat !== undefined && lon !== undefined ? (
        <MyLocationChip lat={lat} lon={lon} onDismiss={handleBackToCity} className="flex-1" />
      ) : (
        <FormField label={t("events.filters.location")} isLabelHidden className="min-w-0 flex-1">
          {(fieldControl) => (
            <CityCombobox
              fieldControl={fieldControl}
              variant="ghost"
              startIcon={<MapPin />}
              value={value.city}
              onValueChange={handleCityChange}
            />
          )}
        </FormField>
      )}
      <Button type="button" variant="outline" size="lg" onClick={onOpenFilters}>
        <SlidersHorizontal aria-hidden />
        {t("events.filters.title")}
      </Button>
    </div>
  );
}
