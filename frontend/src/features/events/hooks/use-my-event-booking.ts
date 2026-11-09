import { useQuery } from "@tanstack/react-query";
import type { BookingRead } from "@/shared/api/generated/model";
import {
  findEventBooking,
  myBookingsInterimQueryOptions,
} from "@/features/events/api/my-event-booking";

interface MyEventBooking {
  booking: BookingRead | null;
  isLoading: boolean;
}

export function useMyEventBooking(eventId: string, isSignedIn: boolean): MyEventBooking {
  const query = useQuery({
    ...myBookingsInterimQueryOptions(),
    enabled: isSignedIn,
    select: (page) => findEventBooking(page.items, eventId),
  });
  return { booking: query.data ?? null, isLoading: query.isLoading };
}
