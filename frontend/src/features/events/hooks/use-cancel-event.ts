import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCancelEventApiV1EventsEventIdDelete } from "@/shared/api/generated/endpoints/events/events";
import type { EventRead } from "@/shared/api/generated/model";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { invalidateEventQueries } from "@/features/events/api/invalidate-event-queries";
import { hasEventStarted } from "@/features/events/lib/has-event-started";

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
        return invalidateEventQueries(queryClient, event.id);
      },
      onError: (error) =>
        showToast(t(getApiErrorKey(error, "events.cancelEvent.failed")), { tone: "error" }),
    },
  });

  return {
    // The backend closes cancellation at the start time.
    canCancel: event.status === "Published" && !hasEventStarted(event),
    isPending: mutation.isPending,
    cancel: () => mutation.mutate({ eventId: event.id }),
  };
}
