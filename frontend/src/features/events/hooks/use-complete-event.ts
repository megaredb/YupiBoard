import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCompleteEventApiV1EventsEventIdCompletePost } from "@/shared/api/generated/endpoints/events/events";
import type { EventRead } from "@/shared/api/generated/model";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { invalidateEventQueries } from "@/features/events/api/invalidate-event-queries";
import { hasEventStarted } from "@/features/events/lib/has-event-started";

export interface CompleteEventAction {
  canComplete: boolean;
  isPending: boolean;
  complete: () => void;
}

export function useCompleteEvent(event: EventRead): CompleteEventAction {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useCompleteEventApiV1EventsEventIdCompletePost({
    mutation: {
      onSuccess: () => {
        showToast(t("events.completeEvent.completed"));
        return invalidateEventQueries(queryClient, event.id);
      },
      onError: (error) =>
        showToast(t(getApiErrorKey(error, "events.completeEvent.failed")), { tone: "error" }),
    },
  });

  const isActiveStatus = event.status === "Published" || event.status === "Ongoing";

  return {
    canComplete: isActiveStatus && hasEventStarted(event),
    isPending: mutation.isPending,
    complete: () => mutation.mutate({ eventId: event.id }),
  };
}
