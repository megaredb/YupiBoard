import { useId, type ChangeEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";
import { useCityOptions } from "@/features/events/hooks/use-city-options";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

interface MobileCatalogToolbarProps {
  value: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
  onOpenFilters: () => void;
}

export function MobileCatalogToolbar({ value, onApply, onOpenFilters }: MobileCatalogToolbarProps) {
  const { t } = useTranslation();
  const selectId = useId();
  const cityOptions = useCityOptions();
  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onApply({ ...value, city: event.target.value });

  return (
    <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
      <div className="min-w-0 flex-1">
        <Label htmlFor={selectId} className="sr-only">
          {t("events.filters.location")}
        </Label>
        <NativeSelect
          id={selectId}
          variant="ghost"
          options={cityOptions}
          value={value.city}
          onChange={handleCityChange}
        />
      </div>
      <Button type="button" variant="outline" size="lg" onClick={onOpenFilters}>
        <SlidersHorizontal aria-hidden />
        {t("events.filters.title")}
      </Button>
    </div>
  );
}
