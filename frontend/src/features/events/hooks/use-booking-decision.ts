import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  approveBookingApiV1EventsEventIdBookingsBookingIdApprovePost,
  rejectBookingApiV1EventsEventIdBookingsBookingIdRejectPost,
} from "@/shared/api/generated/endpoints/bookings/bookings";
import type { BookingRead } from "@/shared/api/generated/model";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { invalidateEventQueries } from "@/features/events/api/invalidate-event-queries";

interface Decision {
  bookingId: string;
  isApproved: boolean;
  reason?: string;
}

interface BookingDecision {
  decide: (bookingId: string, isApproved: boolean, reason?: string) => void;
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
    mutationFn: ({ bookingId, isApproved, reason }: Decision) =>
      isApproved
        ? approveBookingApiV1EventsEventIdBookingsBookingIdApprovePost(eventId, bookingId)
        : rejectBookingApiV1EventsEventIdBookingsBookingIdRejectPost(eventId, bookingId, {
            reason: reason ?? null,
          }),
    onSuccess: (booking) => showToast(t(getDecisionMessageKey(booking))),
    onError: (error) =>
      showToast(t(getApiErrorKey(error, "events.participants.decisionFailed")), { tone: "error" }),
    onSettled: () => invalidateEventQueries(queryClient, eventId),
  });

  return {
    decide: (bookingId, isApproved, reason) => mutation.mutate({ bookingId, isApproved, reason }),
    pendingBookingId: mutation.isPending ? mutation.variables.bookingId : null,
  };
}
