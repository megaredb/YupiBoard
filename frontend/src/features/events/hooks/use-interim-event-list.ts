import { useQuery } from "@tanstack/react-query";
import type { EventListItem } from "@/shared/api/generated/model";
import { toListState } from "@/shared/lib/list-state";
import { interimAllEventsQueryOptions } from "@/features/events/api/event-queries";
import { paginateInterim } from "@/features/events/lib/paginate-interim";
import type { PagedEvents } from "@/features/events/hooks/use-event-catalog";

// INTERIM: replace with the backend's filtered endpoints (organizer, bookings, favorites).
export function useInterimEventList(
  matches: (event: EventListItem) => boolean,
  page: number,
): PagedEvents {
  const query = useQuery(interimAllEventsQueryOptions());
  const paged = query.data ? paginateInterim(query.data.items, matches, page) : null;
  return {
    list: toListState(query, paged?.items),
    total: paged?.total ?? null,
    totalPages: paged?.totalPages ?? 1,
    isRefreshing: false,
  };
}
