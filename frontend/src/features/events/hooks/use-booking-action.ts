import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  useCancelMyBookingApiV1EventsEventIdBookingsMeDelete,
  useCreateBookingRequestApiV1EventsEventIdBookingsPost,
} from "@/shared/api/generated/endpoints/bookings/bookings";
import type { EventRead } from "@/shared/api/generated/model";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { useCurrentUser } from "@/features/auth";
import { invalidateEventQueries } from "@/features/events/api/invalidate-event-queries";
import {
  canApplyBooking,
  canCancelBooking,
  getBookingState,
  type BookingState,
} from "@/features/events/lib/get-booking-state";

export interface BookingAction {
  state: BookingState;
  canApply: boolean;
  canCancel: boolean;
  isPending: boolean;
  apply: () => void;
  cancel: () => void;
}

export function useBookingAction(event: EventRead): BookingAction {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  const refreshBookingData = () => invalidateEventQueries(queryClient, event.id);

  const create = useCreateBookingRequestApiV1EventsEventIdBookingsPost({
    mutation: {
      onSuccess: async () => {
        showToast(t("events.booking.applied"), {
          description: t("events.booking.appliedDescription"),
        });
        await refreshBookingData();
        create.reset();
      },
      onError: (error) =>
        showToast(t(getApiErrorKey(error, "events.booking.failed")), { tone: "error" }),
    },
  });
  const cancel = useCancelMyBookingApiV1EventsEventIdBookingsMeDelete({
    mutation: {
      onSuccess: async () => {
        create.reset();
        showToast(t("events.booking.cancelled"));
        await refreshBookingData();
      },
      onError: (error) =>
        showToast(t(getApiErrorKey(error, "events.booking.cancelFailed")), { tone: "error" }),
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

  const bookingStatus = create.data?.status ?? event.user_booking_status ?? null;
  const state = getBookingState({ event, userId: user?.id ?? null, bookingStatus });

  return {
    state,
    canApply: canApplyBooking(state),
    canCancel: canCancelBooking(state, event),
    isPending: create.isPending || cancel.isPending,
    apply,
    cancel: handleCancel,
  };
}
