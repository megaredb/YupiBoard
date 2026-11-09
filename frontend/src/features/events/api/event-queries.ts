import { queryOptions } from "@tanstack/react-query";
import {
  getEventApiV1EventsEventIdGet,
  getGetEventApiV1EventsEventIdGetQueryKey,
  getListEventsApiV1EventsGetQueryOptions,
  getListMyCreatedEventsApiV1EventsMyCreatedGetQueryOptions,
  getListMyParticipatingEventsApiV1EventsMyParticipatingGetQueryOptions,
} from "@/shared/api/generated/endpoints/events/events";
import { getListFavoritesApiV1UsersMeFavoritesGetQueryOptions } from "@/shared/api/generated/endpoints/favorites/favorites";
import { getGetUserApiV1UsersUserIdGetQueryOptions } from "@/shared/api/generated/endpoints/users/users";
import type { CityRead } from "@/shared/api/generated/model";
import { toListParams } from "@/features/events/lib/to-list-params";
import {
  EVENTS_PAGE_SIZE,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

/** Built from the generated key and fetcher so it also works with `useSuspenseQuery`. */
export function eventDetailsQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: getGetEventApiV1EventsEventIdGetQueryKey(eventId),
    queryFn: ({ signal }) => getEventApiV1EventsEventIdGet(eventId, undefined, signal),
  });
}

export function catalogQueryOptions(filters: CatalogFilters, cities: CityRead[], page: number) {
  return getListEventsApiV1EventsGetQueryOptions(
    toListParams({ filters, cities, page, limit: EVENTS_PAGE_SIZE }),
  );
}

export function organizerQueryOptions(organizerId: string) {
  return getGetUserApiV1UsersUserIdGetQueryOptions(organizerId);
}

/** Published events of one organizer, as shown on their public profile. */
export function hostedEventsQueryOptions(organizerId: string, page: number) {
  return getListEventsApiV1EventsGetQueryOptions({
    organizer_id: organizerId,
    page,
    limit: EVENTS_PAGE_SIZE,
  });
}

/** Every event the signed-in user created, unpublished ones included. */
export function myCreatedEventsQueryOptions(page: number) {
  return getListMyCreatedEventsApiV1EventsMyCreatedGetQueryOptions({
    page,
    limit: EVENTS_PAGE_SIZE,
  });
}

/** Events the signed-in user has a booking for, whatever its status. */
export function myParticipatingEventsQueryOptions(page: number) {
  return getListMyParticipatingEventsApiV1EventsMyParticipatingGetQueryOptions({
    page,
    limit: EVENTS_PAGE_SIZE,
  });
}

export function favoriteEventsQueryOptions(page: number) {
  return getListFavoritesApiV1UsersMeFavoritesGetQueryOptions({ page, limit: EVENTS_PAGE_SIZE });
}
