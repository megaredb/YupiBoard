import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EventRead } from "@/shared/api/generated/model";
import { invalidateEventQueries } from "@/features/events/api/invalidate-event-queries";

/** `setTimeout` fires at once for longer delays; no page stays open that long. */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Booking, attendance and participant views compare the clock with the start time, and the
 * backend's own "started" update can lag behind it. At the start the page re-renders (a refetch
 * alone does not when the server data hasn't changed yet) and refreshes the event's data.
 */
export function useRefreshOnStart(event: Pick<EventRead, "id" | "start_datetime">): void {
  const queryClient = useQueryClient();
  const [, setStartedEventId] = useState<string | null>(null);
  const { id: eventId, start_datetime: startsAt } = event;

  // ORG-9: subscribes to an external system (a timer).
  useEffect(() => {
    const delay = Date.parse(startsAt) - Date.now();
    if (delay <= 0 || delay > MAX_TIMEOUT_MS) return undefined;
    const handleStart = () => {
      setStartedEventId(eventId);
      void invalidateEventQueries(queryClient, eventId);
    };
    const timer = setTimeout(handleStart, delay);
    return () => clearTimeout(timer);
  }, [eventId, startsAt, queryClient]);
}
