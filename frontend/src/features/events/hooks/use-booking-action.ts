import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  getListMyBookingsApiV1BookingsMeGetQueryKey,
  useCancelMyBookingApiV1EventsEventIdBookingsMeDelete,
  useCreateBookingRequestApiV1EventsEventIdBookingsPost,
} from "@/shared/api/generated/endpoints/bookings/bookings";
import {
  getGetEventApiV1EventsEventIdGetQueryKey,
  getListMyParticipatingEventsApiV1EventsMyParticipatingGetQueryKey,
} from "@/shared/api/generated/endpoints/events/events";
import type { EventRead } from "@/shared/api/generated/model";
import { useCurrentUser } from "@/features/auth";
import { useMyEventBooking } from "@/features/events/hooks/use-my-event-booking";
import {
  canCancelBooking,
  getBookingState,
  type BookingState,
} from "@/features/events/lib/get-booking-state";

export type BookingFailure = "apply" | "cancel";

export interface BookingAction {
  state: BookingState;
  canCancel: boolean;
  isPending: boolean;
  failure: BookingFailure | null;
  apply: () => void;
  cancel: () => void;
}

function getFailure(hasApplyFailed: boolean, hasCancelFailed: boolean): BookingFailure | null {
  if (hasApplyFailed) return "apply";
  if (hasCancelFailed) return "cancel";
  return null;
}

/** Apply for and give up a seat. Returns domain state only; components translate it (ORG-6). */
export function useBookingAction(event: EventRead): BookingAction {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const myBooking = useMyEventBooking(event.id, Boolean(user));

  const refreshBookingData = () =>
    Promise.all(
      [
        getGetEventApiV1EventsEventIdGetQueryKey(event.id),
        getListMyBookingsApiV1BookingsMeGetQueryKey(),
        getListMyParticipatingEventsApiV1EventsMyParticipatingGetQueryKey(),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const create = useCreateBookingRequestApiV1EventsEventIdBookingsPost({
    mutation: { onSuccess: refreshBookingData },
  });
  const cancel = useCancelMyBookingApiV1EventsEventIdBookingsMeDelete({
    mutation: {
      onSuccess: () => {
        create.reset();
        return refreshBookingData();
      },
    },
  });

  const apply = () => {
    cancel.reset();
    if (user) create.mutate({ eventId: event.id });
    else void navigate({ to: "/login", search: { redirect: `/events/${event.id}` } });
  };
  const handleCancel = () => {
    create.reset();
    cancel.mutate({ eventId: event.id });
  };

  // The lookup is refreshed after every change; until then the request's own answer stands in.
  const bookingStatus = myBooking.booking?.status ?? create.data?.status ?? null;
  const state = getBookingState({ event, userId: user?.id ?? null, bookingStatus });

  return {
    state,
    canCancel: canCancelBooking(state),
    isPending: create.isPending || cancel.isPending || myBooking.isLoading,
    failure: getFailure(create.isError, cancel.isError),
    apply,
    cancel: handleCancel,
  };
}
