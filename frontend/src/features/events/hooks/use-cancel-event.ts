import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey } from "@/shared/api/generated/endpoints/bookings/bookings";
import {
  getGetEventApiV1EventsEventIdGetQueryKey,
  getListEventsApiV1EventsGetQueryKey,
  getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey,
  useCancelEventApiV1EventsEventIdDelete,
} from "@/shared/api/generated/endpoints/events/events";
import type { EventRead } from "@/shared/api/generated/model";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";

export interface CancelEventAction {
  canCancel: boolean;
  isPending: boolean;
  cancel: () => void;
}

export function useCancelEvent(event: EventRead): CancelEventAction {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useCancelEventApiV1EventsEventIdDelete({
    mutation: {
      onSuccess: () => {
        showToast(t("events.cancelEvent.cancelled"));
        return Promise.all(
          [
            getGetEventApiV1EventsEventIdGetQueryKey(event.id),
            getListEventsApiV1EventsGetQueryKey(),
            getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey(),
            getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey(event.id),
          ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      },
      onError: (error) =>
        showToast(t(getApiErrorKey(error, "events.cancelEvent.failed")), { tone: "error" }),
    },
  });

  return {
    canCancel: event.status === "Published",
    isPending: mutation.isPending,
    cancel: () => mutation.mutate({ eventId: event.id }),
  };
}
