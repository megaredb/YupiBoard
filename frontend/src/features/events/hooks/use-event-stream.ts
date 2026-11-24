import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { streamEventUpdatesApiV1EventsEventIdStreamGet } from "@/shared/api/generated/endpoints/events/events";
import { connectSseStream, SSE_REQUEST_OPTIONS } from "@/shared/api/sse";
import { invalidateEventQueries } from "@/features/events/api/invalidate-event-queries";

const EVENT_UPDATED = "event.updated";

/** Keeps the open event's status, seats and bookings live while its page is shown. */
export function useEventStream(eventId: string): void {
  const queryClient = useQueryClient();

  // ORG-9: subscribes to an external system (the server's event stream).
  useEffect(() => {
    const controller = new AbortController();
    const refreshEvent = () => void invalidateEventQueries(queryClient, eventId);

    void connectSseStream({
      open: (signal) =>
        streamEventUpdatesApiV1EventsEventIdStreamGet(eventId, SSE_REQUEST_OPTIONS, signal),
      signal: controller.signal,
      onMessage: (message) => {
        if (message.event === EVENT_UPDATED) refreshEvent();
      },
      onReconnect: refreshEvent,
    });

    return () => controller.abort();
  }, [eventId, queryClient]);
}
