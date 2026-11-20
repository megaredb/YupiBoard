import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { joinedEventsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedList, type PagedEvents } from "@/features/events/lib/to-paged-list";

export function useJoinedEvents(participantId: string, page: number): PagedEvents {
  const query = useQuery({
    ...joinedEventsQueryOptions(participantId, page),
    placeholderData: keepPreviousData,
  });
  return toPagedList(query);
}
