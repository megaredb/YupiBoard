import { getListModerationEventsApiV1ModerationEventsGetQueryOptions } from "@/shared/api/generated/endpoints/moderation/moderation";
import type {
  EventStatus,
  ListModerationEventsApiV1ModerationEventsGetParams,
  ModerationSortBy,
  SortOrder,
} from "@/shared/api/generated/model";
import { EVENTS_PAGE_SIZE } from "@/features/events";
import type {
  ModerationSearch,
  ModerationSort,
  ModerationTab,
} from "@/features/moderation/schemas/moderation-search.schema";

const STATUS_BY_TAB = {
  pending: "OnModeration",
  approved: "Published",
  rejected: "Rejected",
} as const satisfies Record<ModerationTab, EventStatus>;

const SORT_PARAMS = {
  "date-asc": ["start_datetime", "asc"],
  "date-desc": ["start_datetime", "desc"],
  "name-asc": ["title", "asc"],
  "name-desc": ["title", "desc"],
} as const satisfies Record<ModerationSort, readonly [ModerationSortBy, SortOrder]>;

export function moderationQueueQueryOptions({ tab, q, sort, page }: ModerationSearch) {
  const [sortBy, sortOrder] = SORT_PARAMS[sort];
  const params: ListModerationEventsApiV1ModerationEventsGetParams = {
    status: STATUS_BY_TAB[tab],
    q,
    sort_by: sortBy,
    sort_order: sortOrder,
    page,
    limit: EVENTS_PAGE_SIZE,
  };
  return getListModerationEventsApiV1ModerationEventsGetQueryOptions(params);
}

/** Only `total` is read from this one, for the "Pending (4)" label. */
export function moderationPendingCountQueryOptions() {
  return getListModerationEventsApiV1ModerationEventsGetQueryOptions({
    status: STATUS_BY_TAB.pending,
    page: 1,
    limit: 1,
  });
}
