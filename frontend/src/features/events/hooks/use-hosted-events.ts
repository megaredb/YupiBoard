import type { PagedEvents } from "@/features/events/hooks/use-event-catalog";
import { useInterimEventList } from "@/features/events/hooks/use-interim-event-list";

// INTERIM: needs `GET /events?organizer_id=` (including the organizer's unpublished events).
export function useHostedEvents(organizerId: string, page: number): PagedEvents {
  return useInterimEventList((event) => event.organizer.id === organizerId, page);
}
