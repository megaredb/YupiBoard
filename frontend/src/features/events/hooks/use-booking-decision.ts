import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveBookingApiV1EventsEventIdBookingsBookingIdApprovePost,
  getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey,
  getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey,
  rejectBookingApiV1EventsEventIdBookingsBookingIdRejectPost,
} from "@/shared/api/generated/endpoints/bookings/bookings";
import { getGetEventApiV1EventsEventIdGetQueryKey } from "@/shared/api/generated/endpoints/events/events";

interface Decision {
  bookingId: string;
  isApproved: boolean;
}

interface BookingDecision {
  decide: (bookingId: string, isApproved: boolean) => void;
  /** The booking whose decision is being sent, if any. */
  pendingBookingId: string | null;
  hasFailed: boolean;
}

/** The host accepts or declines a pending request; seats and lists are refreshed afterwards. */
export function useBookingDecision(eventId: string): BookingDecision {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ bookingId, isApproved }: Decision) =>
      isApproved
        ? approveBookingApiV1EventsEventIdBookingsBookingIdApprovePost(eventId, bookingId)
        : rejectBookingApiV1EventsEventIdBookingsBookingIdRejectPost(eventId, bookingId),
    onSettled: () =>
      Promise.all(
        [
          getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey(eventId),
          getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey(eventId),
          getGetEventApiV1EventsEventIdGetQueryKey(eventId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });

  return {
    decide: (bookingId, isApproved) => mutation.mutate({ bookingId, isApproved }),
    pendingBookingId: mutation.isPending ? mutation.variables.bookingId : null,
    hasFailed: mutation.isError,
  };
}
