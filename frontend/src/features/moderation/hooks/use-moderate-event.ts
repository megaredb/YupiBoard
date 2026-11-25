import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  approveEventApiV1ModerationEventsEventIdApprovePost,
  rejectEventApiV1ModerationEventsEventIdRejectPost,
} from "@/shared/api/generated/endpoints/moderation/moderation";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { invalidateEventQueries } from "@/features/events";

/** The backend requires a reason for every rejection. */
type Decision = { isApproved: true } | { isApproved: false; reason: string };

interface ModerateEvent {
  decide: (decision: Decision) => void;
  isPending: boolean;
}

export function useModerateEvent(eventId: string): ModerateEvent {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (decision: Decision) =>
      decision.isApproved
        ? approveEventApiV1ModerationEventsEventIdApprovePost(eventId)
        : rejectEventApiV1ModerationEventsEventIdRejectPost(eventId, { reason: decision.reason }),
    onSuccess: (_event, { isApproved }) =>
      showToast(t(isApproved ? "moderation.approved" : "moderation.rejected")),
    onError: (error) =>
      showToast(t(getApiErrorKey(error, "moderation.decisionFailed")), { tone: "error" }),
    // A published event joins the catalog and the organizer's list, not only the queue.
    onSettled: () => invalidateEventQueries(queryClient, eventId),
  });

  return {
    decide: (decision) => mutation.mutate(decision),
    isPending: mutation.isPending,
  };
}
