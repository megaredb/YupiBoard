import type { QueryClient } from "@tanstack/react-query";
import {
  getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey,
  getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey,
  getListMyBookingsApiV1BookingsMeGetQueryKey,
} from "@/shared/api/generated/endpoints/bookings/bookings";
import {
  getGetEventApiV1EventsEventIdGetQueryKey,
  getListEventsApiV1EventsGetQueryKey,
  getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey,
  getListMyParticipatingEventsApiV1EventsMyParticipatingGetQueryKey,
} from "@/shared/api/generated/endpoints/events/events";
import { getListFavoritesApiV1UsersMeFavoritesGetQueryKey } from "@/shared/api/generated/endpoints/favorites/favorites";
import { getListModerationEventsApiV1ModerationEventsGetQueryKey } from "@/shared/api/generated/endpoints/moderation/moderation";
import { getGetMyEventReviewsApiV1EventsEventIdReviewsMeGetQueryKey } from "@/shared/api/generated/endpoints/reviews/reviews";

export async function invalidateEventQueries(
  queryClient: QueryClient,
  eventId: string,
): Promise<void> {
  const queryKeys = [
    getGetEventApiV1EventsEventIdGetQueryKey(eventId),
    getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey(eventId),
    getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey(eventId),
    // Marking a player present opens their review window.
    getGetMyEventReviewsApiV1EventsEventIdReviewsMeGetQueryKey(eventId),
    getListEventsApiV1EventsGetQueryKey(),
    getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey(),
    getListMyParticipatingEventsApiV1EventsMyParticipatingGetQueryKey(),
    getListMyBookingsApiV1BookingsMeGetQueryKey(),
    getListFavoritesApiV1UsersMeFavoritesGetQueryKey(),
    getListModerationEventsApiV1ModerationEventsGetQueryKey(),
  ];
  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
