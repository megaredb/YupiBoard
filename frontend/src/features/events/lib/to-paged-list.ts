import type { EventListItem } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";

export interface PagedList<T> {
  list: ListState<T>;
  total: number | null;
  totalPages: number;
  /** A newer page is loading while the previous one stays on screen. */
  isRefreshing: boolean;
}

export type PagedEvents = PagedList<EventListItem>;

interface PageQuery<T> {
  isPending: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  refetch: () => unknown;
  data: { items: T[]; total: number; total_pages: number } | undefined;
}

export function toPagedList<T>(query: PageQuery<T>): PagedList<T> {
  return {
    list: toListState(query, query.data?.items),
    total: query.data?.total ?? null,
    totalPages: query.data?.total_pages ?? 1,
    isRefreshing: query.isPlaceholderData,
  };
}
