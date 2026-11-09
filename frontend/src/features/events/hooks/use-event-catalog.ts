import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/features/events/api/event-queries";
import { toPagedList, type PagedEvents } from "@/features/events/lib/to-paged-list";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";
import { useCities } from "@/features/locations";

export function useEventCatalog(filters: CatalogFilters, page: number): PagedEvents {
  const cities = useCities();
  const query = useQuery({
    ...catalogQueryOptions(filters, cities, page),
    placeholderData: keepPreviousData,
  });
  return toPagedList(query);
}
