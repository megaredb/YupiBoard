import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { EventRead } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";
import { EVENTS_PAGE_SIZE } from "@/features/events";
import {
  moderationPendingCountQueryOptions,
  moderationQueueQueryOptions,
} from "@/features/moderation/api/moderation-queries";
import { filterAndSortEvents } from "@/features/moderation/lib/filter-and-sort-events";
import type { ModerationSearch } from "@/features/moderation/schemas/moderation-search.schema";

interface ModerationQueue {
  list: ListState<EventRead>;
  /** Events matching the search; `null` until the tab has loaded. */
  total: number | null;
  totalPages: number;
  /** The page shown: the requested one, pulled back when the list got shorter. */
  page: number;
  pendingCount: number | null;
  isRefreshing: boolean;
}

export function useModerationQueue({ tab, q, sort, page }: ModerationSearch): ModerationQueue {
  const query = useQuery({
    ...moderationQueueQueryOptions(tab),
    placeholderData: keepPreviousData,
  });
  const pending = useQuery(moderationPendingCountQueryOptions());

  const matching = query.data ? filterAndSortEvents(query.data.items, q, sort) : undefined;
  const total = matching?.length ?? null;
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / EVENTS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * EVENTS_PAGE_SIZE;

  return {
    list: toListState(query, matching?.slice(start, start + EVENTS_PAGE_SIZE)),
    total,
    totalPages,
    page: currentPage,
    pendingCount: pending.data?.total ?? null,
    isRefreshing: query.isPlaceholderData,
  };
}
