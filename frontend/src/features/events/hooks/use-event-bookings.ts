import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getListEventBookingsApiV1EventsEventIdBookingsGetQueryOptions } from "@/shared/api/generated/endpoints/bookings/bookings";
import type { BookingRead } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";
import { EVENT_BOOKINGS_PAGE_SIZE } from "@/features/events/schemas/event-details-search.schema";

interface EventBookings {
  list: ListState<BookingRead>;
  total: number | null;
  totalPages: number;
}

export function useEventBookings(eventId: string, page: number): EventBookings {
  const query = useQuery({
    ...getListEventBookingsApiV1EventsEventIdBookingsGetQueryOptions(eventId, {
      page,
      limit: EVENT_BOOKINGS_PAGE_SIZE,
      sort_by: "date",
      sort_order: "asc",
    }),
    placeholderData: keepPreviousData,
  });
  return {
    list: toListState(query, query.data?.items),
    total: query.data?.total ?? null,
    totalPages: query.data?.total_pages ?? 1,
  };
}
