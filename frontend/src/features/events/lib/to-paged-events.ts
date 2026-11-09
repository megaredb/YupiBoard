import type { EventListItem } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";

export interface PagedEvents {
  list: ListState<EventListItem>;
  /** Total matches, known once the first page has loaded. */
  total: number | null;
  totalPages: number;
  /** A newer page is loading while the previous one stays on screen. */
  isRefreshing: boolean;
}

interface EventPageQuery {
  isPending: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  refetch: () => unknown;
  data: { items: EventListItem[]; total: number; total_pages: number } | undefined;
}

/** Any paginated event list of the API (`EventPage`, `FavoritePage`) as one list state. */
export function toPagedEvents(query: EventPageQuery): PagedEvents {
  return {
    list: toListState(query, query.data?.items),
    total: query.data?.total ?? null,
    totalPages: query.data?.total_pages ?? 1,
    isRefreshing: query.isPlaceholderData,
  };
}
