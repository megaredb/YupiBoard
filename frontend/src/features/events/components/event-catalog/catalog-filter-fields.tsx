import { CostFilter } from "@/features/events/components/event-catalog/cost-filter";
import { DateFilter } from "@/features/events/components/event-catalog/date-filter";
import { LocationFilter } from "@/features/events/components/event-catalog/location-filter";
import { RatingFilter } from "@/features/events/components/event-catalog/rating-filter";
import { SeatsFilter } from "@/features/events/components/event-catalog/seats-filter";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

interface CatalogFilterFieldsProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}

/** The filter panel's fields, shared by the desktop sidebar and the phone sheet. */
export function CatalogFilterFields({ value, onChange }: CatalogFilterFieldsProps) {
  return (
    <div className="space-y-4">
      <LocationFilter value={value} onChange={onChange} />
      <DateFilter value={value} onChange={onChange} />
      <CostFilter value={value} onChange={onChange} />
      <SeatsFilter value={value} onChange={onChange} />
      <RatingFilter value={value} onChange={onChange} />
    </div>
  );
}
