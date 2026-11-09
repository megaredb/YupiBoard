import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { myCreatedEventsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedList, type PagedEvents } from "@/features/events/lib/to-paged-list";
import type { MyEventsSearch } from "@/features/events/schemas/personal-list-search.schema";

export function useMyCreatedEvents(search: MyEventsSearch): PagedEvents {
  const query = useQuery({
    ...myCreatedEventsQueryOptions(search),
    placeholderData: keepPreviousData,
  });
  return toPagedList(query);
}
