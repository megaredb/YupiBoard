import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { CatalogFilterFields } from "@/features/events/components/event-catalog/catalog-filter-fields";
import { clearCatalogFilters } from "@/features/events/lib/clear-catalog-filters";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

interface CatalogFiltersCardProps {
  value: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
}

/** Desktop sidebar: every change applies immediately. */
export function CatalogFiltersCard({ value, onApply }: CatalogFiltersCardProps) {
  const { t } = useTranslation();
  const handleClear = () => onApply(clearCatalogFilters(value));

  return (
    <Card>
      <Card.Header>
        <Card.Title size="lg" className="flex items-center justify-between">
          {t("events.filters.title")}
          <SlidersHorizontal aria-hidden className="size-4 text-muted-foreground" />
        </Card.Title>
      </Card.Header>
      <Card.Content className="space-y-5">
        <CatalogFilterFields value={value} onChange={onApply} />
        <div className="border-t pt-4">
          <Button variant="outline" size="lg" className="w-full" onClick={handleClear}>
            {t("events.filters.clear")}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
