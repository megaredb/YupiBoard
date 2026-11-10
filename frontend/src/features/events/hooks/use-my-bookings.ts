import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { BookingRead } from "@/shared/api/generated/model";
import { myBookingsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedList, type PagedList } from "@/features/events/lib/to-paged-list";
import type { MyBookingsSearch } from "@/features/events/schemas/personal-list-search.schema";

export function useMyBookings(search: MyBookingsSearch): PagedList<BookingRead> {
  const query = useQuery({
    ...myBookingsQueryOptions(search),
    placeholderData: keepPreviousData,
  });
  return toPagedList(query);
}
