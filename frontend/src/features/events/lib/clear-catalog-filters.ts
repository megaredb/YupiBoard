import {
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

/** "Clear filters" resets the filter panel; the search text and the sort order stay. */
export function clearCatalogFilters({ q, sort }: CatalogFilters): CatalogFilters {
  return { ...DEFAULT_CATALOG_FILTERS, q, sort };
}
