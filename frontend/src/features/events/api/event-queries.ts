import { queryOptions } from "@tanstack/react-query"
import {
  getEventApiV1EventsEventIdGet,
  getGetEventApiV1EventsEventIdGetQueryKey,
  getListEventsApiV1EventsGetQueryOptions,
} from "@/shared/api/generated/endpoints/events/events"
import { getGetUserApiV1UsersUserIdGetQueryOptions } from "@/shared/api/generated/endpoints/users/users"
import type { ListEventsApiV1EventsGetParams } from "@/shared/api/generated/model"
import { toListParams } from "@/features/events/lib/to-list-params"
import {
  EVENTS_PAGE_SIZE,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema"

/** Built from the generated key and fetcher so it also works with `useSuspenseQuery`. */
export function eventDetailsQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: getGetEventApiV1EventsEventIdGetQueryKey(eventId),
    queryFn: ({ signal }) => getEventApiV1EventsEventIdGet(eventId, undefined, signal),
  })
}

export function catalogQueryOptions(filters: CatalogFilters, page: number) {
  return getListEventsApiV1EventsGetQueryOptions(toListParams(filters, page, EVENTS_PAGE_SIZE))
}

/** Organizer profile shown on the event page. */
export function organizerQueryOptions(organizerId: string) {
  return getGetUserApiV1UsersUserIdGetQueryOptions(organizerId)
}

// INTERIM: the backend must provide filtered, server-paginated lists (`?organizer_id=`, the
// user's bookings, favorites). Until then personal lists filter the newest events client-side.
const INTERIM_LIST_PARAMS: ListEventsApiV1EventsGetParams = { limit: 100 }

export function interimAllEventsQueryOptions() {
  return getListEventsApiV1EventsGetQueryOptions(INTERIM_LIST_PARAMS)
}
