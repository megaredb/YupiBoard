import { getListModerationEventsApiV1ModerationEventsGetQueryOptions } from "@/shared/api/generated/endpoints/moderation/moderation";
import type {
  EventStatus,
  ListModerationEventsApiV1ModerationEventsGetParams,
  ModerationSortBy,
  SortOrder,
} from "@/shared/api/generated/model";
import type { Coordinates } from "@/shared/platform/geolocation";
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
  "distance-asc": ["distance", "asc"],
  "distance-desc": ["distance", "desc"],
  "date-asc": ["start_datetime", "asc"],
  "date-desc": ["start_datetime", "desc"],
  "cost-asc": ["cost", "asc"],
  "cost-desc": ["cost", "desc"],
} as const satisfies Record<ModerationSort, readonly [ModerationSortBy, SortOrder]>;

/** Without a city to measure from, a distance sort falls back to the backend's queue order. */
function toSortParams(sort: ModerationSort, origin: Coordinates | undefined) {
  const [sortBy, sortOrder] = SORT_PARAMS[sort];
  if (sortBy !== "distance") return { sort_by: sortBy, sort_order: sortOrder };
  if (!origin) return { sort_by: "created_at" as const, sort_order: "asc" as const };
  return { sort_by: sortBy, sort_order: sortOrder, lat: origin.lat, lon: origin.lon };
}

export function moderationQueueQueryOptions(
  { tab, q, sort, page }: ModerationSearch,
  origin: Coordinates | undefined,
) {
  const params: ListModerationEventsApiV1ModerationEventsGetParams = {
    status: STATUS_BY_TAB[tab],
    q,
    ...toSortParams(sort, origin),
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
