import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { myCreatedEventsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedEvents, type PagedEvents } from "@/features/events/lib/to-paged-events";

export function useMyCreatedEvents(page: number): PagedEvents {
  const query = useQuery({
    ...myCreatedEventsQueryOptions(page),
    placeholderData: keepPreviousData,
  });
  return toPagedEvents(query);
}
