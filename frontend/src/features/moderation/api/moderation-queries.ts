import { getListModerationEventsApiV1ModerationEventsGetQueryOptions } from "@/shared/api/generated/endpoints/moderation/moderation";
import type { EventStatus } from "@/shared/api/generated/model";
import type { ModerationTab } from "@/features/moderation/schemas/moderation-search.schema";

const STATUS_BY_TAB = {
  pending: "OnModeration",
  approved: "Published",
  rejected: "Rejected",
} as const satisfies Record<ModerationTab, EventStatus>;

/** The most the backend returns per request. */
const MODERATION_FETCH_LIMIT = 100;

/**
 * One tab's events, oldest first. The backend has no search or sort for this list, so the page
 * loads the whole tab (up to the backend maximum) and narrows it down on the client.
 */
export function moderationQueueQueryOptions(tab: ModerationTab) {
  return getListModerationEventsApiV1ModerationEventsGetQueryOptions({
    status: STATUS_BY_TAB[tab],
    page: 1,
    limit: MODERATION_FETCH_LIMIT,
  });
}

/** Only `total` is read from this one, for the "Pending (4)" label. */
export function moderationPendingCountQueryOptions() {
  return getListModerationEventsApiV1ModerationEventsGetQueryOptions({
    status: STATUS_BY_TAB.pending,
    page: 1,
    limit: 1,
  });
}
