import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { hostedEventsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedList, type PagedEvents } from "@/features/events/lib/to-paged-list";

export function useHostedEvents(organizerId: string, page: number): PagedEvents {
  const query = useQuery({
    ...hostedEventsQueryOptions(organizerId, page),
    placeholderData: keepPreviousData,
  });
  return toPagedList(query);
}
