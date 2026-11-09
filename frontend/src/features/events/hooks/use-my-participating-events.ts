import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { myParticipatingEventsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedEvents, type PagedEvents } from "@/features/events/lib/to-paged-events";

export function useMyParticipatingEvents(page: number): PagedEvents {
  const query = useQuery({
    ...myParticipatingEventsQueryOptions(page),
    placeholderData: keepPreviousData,
  });
  return toPagedEvents(query);
}
