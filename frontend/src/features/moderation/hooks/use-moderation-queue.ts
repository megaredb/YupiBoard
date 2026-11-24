import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ModerationEventRead } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";
import { usePreferredCity } from "@/features/locations";
import {
  moderationPendingCountQueryOptions,
  moderationQueueQueryOptions,
} from "@/features/moderation/api/moderation-queries";
import type { ModerationSearch } from "@/features/moderation/schemas/moderation-search.schema";

interface ModerationQueue {
  list: ListState<ModerationEventRead>;
  /** Events matching the search; `null` until the tab has loaded. */
  total: number | null;
  totalPages: number;
  pendingCount: number | null;
  isRefreshing: boolean;
}

export function useModerationQueue(search: ModerationSearch): ModerationQueue {
  const origin = usePreferredCity();
  const query = useQuery({
    ...moderationQueueQueryOptions(search, origin),
    placeholderData: keepPreviousData,
  });
  const pending = useQuery(moderationPendingCountQueryOptions());

  return {
    list: toListState(query, query.data?.items),
    total: query.data?.total ?? null,
    totalPages: query.data?.total_pages ?? 1,
    pendingCount: pending.data?.total ?? null,
    isRefreshing: query.isPlaceholderData,
  };
}
