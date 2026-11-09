import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { EventListItem } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";
import { catalogQueryOptions } from "@/features/events/api/event-queries";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

export interface PagedEvents {
  list: ListState<EventListItem>;
  /** Total matches, known once the first page has loaded. */
  total: number | null;
  totalPages: number;
  /** A newer page is loading while the previous one stays on screen. */
  isRefreshing: boolean;
}

export function useEventCatalog(filters: CatalogFilters, page: number): PagedEvents {
  const query = useQuery({
    ...catalogQueryOptions(filters, page),
    placeholderData: keepPreviousData,
  });
  return {
    list: toListState(query, query.data?.items),
    total: query.data?.total ?? null,
    totalPages: query.data?.total_pages ?? 1,
    isRefreshing: query.isPlaceholderData,
  };
}
