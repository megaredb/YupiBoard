import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/features/events/api/event-queries";
import { useCities } from "@/features/events/hooks/use-cities";
import { toPagedEvents, type PagedEvents } from "@/features/events/lib/to-paged-events";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

export function useEventCatalog(filters: CatalogFilters, page: number): PagedEvents {
  const cities = useCities();
  const query = useQuery({
    ...catalogQueryOptions(filters, cities, page),
    placeholderData: keepPreviousData,
  });
  return toPagedEvents(query);
}
