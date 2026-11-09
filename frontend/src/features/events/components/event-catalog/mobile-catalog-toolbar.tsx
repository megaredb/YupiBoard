import type { ChangeEvent } from "react";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/ui/button";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";
import { CitySelect } from "@/features/locations";

interface MobileCatalogToolbarProps {
  value: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
  onOpenFilters: () => void;
}

export function MobileCatalogToolbar({ value, onApply, onOpenFilters }: MobileCatalogToolbarProps) {
  const { t } = useTranslation();
  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onApply({ ...value, city: event.target.value });

  return (
    <div className="flex items-center justify-between gap-3 desktop:hidden">
      <FormField label={t("events.filters.location")} isLabelHidden className="min-w-0 flex-1">
        {(fieldControl) => (
          <CitySelect
            {...fieldControl}
            variant="ghost"
            startIcon={<MapPin />}
            value={value.city}
            onChange={handleCityChange}
          />
        )}
      </FormField>
      <Button type="button" variant="outline" size="lg" onClick={onOpenFilters}>
        <SlidersHorizontal aria-hidden />
        {t("events.filters.title")}
      </Button>
    </div>
  );
}
