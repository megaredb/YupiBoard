import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { connectSseStream } from "@/shared/api/sse";

export function useEventStream(eventId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const controller = new AbortController();

    void connectSseStream({
      path: `/api/v1/events/${eventId}/stream`,
      requireAuth: false,
      signal: controller.signal,
      onEvent: (message) => {
        if (message.event !== "event.updated") return;
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: getGetEventApiV1EventsEventIdGetQueryKey(eventId),
          }),
          queryClient.invalidateQueries({
            queryKey: getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey(eventId),
          }),
          queryClient.invalidateQueries({
            queryKey: getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey(eventId),
          }),
          queryClient.invalidateQueries({
            queryKey: getListEventsApiV1EventsGetQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getListMyBookingsApiV1BookingsMeGetQueryKey(),
          }),
        ]);
      },
    });

    return () => controller.abort();
  }, [eventId, queryClient]);
}
