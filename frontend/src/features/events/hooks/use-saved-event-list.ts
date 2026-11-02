import { useSavedEventIds } from "@/features/saved-events";
import { useInterimEventList } from "@/features/events/hooks/use-interim-event-list";
import type { PagedEvents } from "@/features/events/hooks/use-event-catalog";

// INTERIM: needs `GET /users/me/bookings` and favorites endpoints; ids are device-local until then.
export function useSavedEventList(kind: "favorites" | "bookings", page: number): PagedEvents {
  const savedIds = useSavedEventIds(kind);
  return useInterimEventList((event) => savedIds.includes(event.id), page);
}
