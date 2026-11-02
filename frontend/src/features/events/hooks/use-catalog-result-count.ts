import { useQuery } from "@tanstack/react-query";
import { getListEventsApiV1EventsGetQueryOptions } from "@/shared/api/generated/endpoints/events/events";
import { toListParams } from "@/features/events/lib/to-list-params";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

/** Number of matches for draft filters; a page of one item is enough to read `total`. */
export function useCatalogResultCount(filters: CatalogFilters): number | null {
  const { data } = useQuery(getListEventsApiV1EventsGetQueryOptions(toListParams(filters, 1, 1)));
  return data?.total ?? null;
}
