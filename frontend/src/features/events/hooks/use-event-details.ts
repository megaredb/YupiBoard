import { useSuspenseQuery } from "@tanstack/react-query";
import type { EventRead } from "@/shared/api/generated/model";
import { eventDetailsQueryOptions } from "@/features/events/api/event-queries";

/** The route loader has already fetched the event; this keeps it fresh after mutations. */
export function useEventDetails(eventId: string): EventRead {
  return useSuspenseQuery(eventDetailsQueryOptions(eventId)).data;
}
