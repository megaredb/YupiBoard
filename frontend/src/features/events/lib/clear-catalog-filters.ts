import {
  DEFAULT_DISTANCE,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

/** "Clear filters" resets the filter panel; the location, search text and sort order stay. */
export function clearCatalogFilters({ city, lat, lon, q, sort }: CatalogFilters): CatalogFilters {
  return { city, lat, lon, q, sort, distance: DEFAULT_DISTANCE };
}
