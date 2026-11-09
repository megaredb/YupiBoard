import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { favoriteEventsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedEvents, type PagedEvents } from "@/features/events/lib/to-paged-events";

export function useFavoriteEvents(page: number): PagedEvents {
  const query = useQuery({
    ...favoriteEventsQueryOptions(page),
    placeholderData: keepPreviousData,
  });
  return toPagedEvents(query);
}
