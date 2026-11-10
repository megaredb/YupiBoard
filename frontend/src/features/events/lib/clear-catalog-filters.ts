import {
  DEFAULT_DISTANCE,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

/** "Clear filters" resets the filter panel; the city, search text and sort order stay. */
export function clearCatalogFilters({ city, q, sort }: CatalogFilters): CatalogFilters {
  return { city, q, sort, distance: DEFAULT_DISTANCE };
}
