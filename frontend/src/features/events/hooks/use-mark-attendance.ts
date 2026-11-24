import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { markAttendanceApiV1EventsEventIdBookingsBookingIdAttendancePost } from "@/shared/api/generated/endpoints/bookings/bookings";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { invalidateEventQueries } from "@/features/events/api/invalidate-event-queries";

interface Attendance {
  bookingId: string;
  attended: boolean;
}

export interface MarkAttendance {
  mark: (bookingId: string, attended: boolean) => void;
  pendingBookingId: string | null;
}

export function useMarkAttendance(eventId: string): MarkAttendance {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ bookingId, attended }: Attendance) =>
      markAttendanceApiV1EventsEventIdBookingsBookingIdAttendancePost(eventId, bookingId, {
        attended,
      }),
    onSuccess: () => showToast(t("events.attendance.saved")),
    onError: (error) =>
      showToast(t(getApiErrorKey(error, "events.attendance.saveFailed")), { tone: "error" }),
    onSettled: () => invalidateEventQueries(queryClient, eventId),
  });

  return {
    mark: (bookingId, attended) => mutation.mutate({ bookingId, attended }),
    pendingBookingId: mutation.isPending ? mutation.variables.bookingId : null,
  };
}
