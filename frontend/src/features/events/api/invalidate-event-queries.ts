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
} from "@/shared/api/generated/endpoints/events/events";

/** Refetches everything that shows an event's status, seats or bookings after it changed. */
export async function invalidateEventQueries(
  queryClient: QueryClient,
  eventId: string,
): Promise<void> {
  const queryKeys = [
    getGetEventApiV1EventsEventIdGetQueryKey(eventId),
    getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey(eventId),
    getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey(eventId),
    getListEventsApiV1EventsGetQueryKey(),
    getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey(),
    getListMyBookingsApiV1BookingsMeGetQueryKey(),
  ];
  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
