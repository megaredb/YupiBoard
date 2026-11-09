import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  approveBookingApiV1EventsEventIdBookingsBookingIdApprovePost,
  getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey,
  getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey,
  rejectBookingApiV1EventsEventIdBookingsBookingIdRejectPost,
} from "@/shared/api/generated/endpoints/bookings/bookings";
import { getGetEventApiV1EventsEventIdGetQueryKey } from "@/shared/api/generated/endpoints/events/events";
import type { BookingRead } from "@/shared/api/generated/model";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";

interface Decision {
  bookingId: string;
  isApproved: boolean;
}

interface BookingDecision {
  decide: (bookingId: string, isApproved: boolean) => void;
  /** The booking whose decision is being sent, if any. */
  pendingBookingId: string | null;
}

/** An accepted request lands on the waitlist when the table filled up in the meantime. */
function getDecisionMessageKey({ status }: BookingRead) {
  if (status === "Confirmed") return "events.participants.accepted";
  if (status === "Waitlist") return "events.participants.waitlisted";
  return "events.participants.declined";
}

export function useBookingDecision(eventId: string): BookingDecision {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ bookingId, isApproved }: Decision) =>
      isApproved
        ? approveBookingApiV1EventsEventIdBookingsBookingIdApprovePost(eventId, bookingId)
        : rejectBookingApiV1EventsEventIdBookingsBookingIdRejectPost(eventId, bookingId),
    onSuccess: (booking) => showToast(t(getDecisionMessageKey(booking))),
    onError: (error) =>
      showToast(t(getApiErrorKey(error, "events.participants.decisionFailed")), { tone: "error" }),
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
  };
}
