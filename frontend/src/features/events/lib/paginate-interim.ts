import type { EventListItem } from "@/shared/api/generated/model";
import { EVENTS_PAGE_SIZE } from "@/features/events/schemas/catalog-search.schema";

export interface InterimPage {
  items: EventListItem[];
  total: number;
  totalPages: number;
}

// INTERIM: client-side filtering and paging of server lists breaks API-8. It disappears once the
// backend offers filtered, paginated endpoints for organizer, bookings and favorites.
export function paginateInterim(
  events: EventListItem[],
  matches: (event: EventListItem) => boolean,
  page: number,
): InterimPage {
  const filtered = events.filter(matches);
  const start = (page - 1) * EVENTS_PAGE_SIZE;
  return {
    items: filtered.slice(start, start + EVENTS_PAGE_SIZE),
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / EVENTS_PAGE_SIZE)),
  };
}
