import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { EventRead } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";
import { EVENTS_PAGE_SIZE } from "@/features/events";
import {
  moderationPendingCountQueryOptions,
  moderationQueueQueryOptions,
} from "@/features/moderation/api/moderation-queries";
import { searchModerationEvents } from "@/features/moderation/lib/search-moderation-events";
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
  // Before the tab loads this is an empty page; `toListState` reports it as pending.
  const result = searchModerationEvents(query.data?.items ?? [], {
    q,
    sort,
    page,
    limit: EVENTS_PAGE_SIZE,
  });

  return {
    list: toListState(query, result.items),
    total: query.data ? result.total : null,
    totalPages: result.total_pages,
    page: result.page,
    pendingCount: pending.data?.total ?? null,
    isRefreshing: query.isPlaceholderData,
  };
}
