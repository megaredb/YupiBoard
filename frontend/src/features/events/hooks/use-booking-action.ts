import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCreateBookingRequestApiV1EventsIdBookingsPost } from "@/shared/api/generated/endpoints/bookings/bookings";
import { getGetEventApiV1EventsEventIdGetQueryKey } from "@/shared/api/generated/endpoints/events/events";
import type { EventRead } from "@/shared/api/generated/model";
import { useCurrentUser } from "@/features/auth";
import { setEventSaved, useSavedEventIds } from "@/features/saved-events";
import { getBookingState, type BookingState } from "@/features/events/lib/get-booking-state";

export interface BookingAction {
  state: BookingState;
  isPending: boolean;
  hasFailed: boolean;
  apply: () => void;
}

/** Returns domain state only; components translate it (ORG-6). */
export function useBookingAction(event: EventRead): BookingAction {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const appliedIds = useSavedEventIds("bookings");

  const booking = useCreateBookingRequestApiV1EventsIdBookingsPost({
    mutation: {
      onSuccess: () => {
        void setEventSaved("bookings", event.id, true);
        return queryClient.invalidateQueries({
          queryKey: getGetEventApiV1EventsEventIdGetQueryKey(event.id),
        });
      },
    },
  });

  const apply = () => {
    if (user) booking.mutate({ id: event.id });
    else void navigate({ to: "/login", search: { redirect: `/events/${event.id}` } });
  };

  return {
    state: getBookingState({
      event,
      userId: user?.id ?? null,
      requestStatus: booking.data?.status ?? null,
      hasApplied: appliedIds.includes(event.id),
    }),
    isPending: booking.isPending,
    hasFailed: booking.isError,
    apply,
  };
}
