import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getGetEventApiV1EventsEventIdGetQueryKey } from "@/shared/api/generated/endpoints/events/events";
import {
  approveEventApiV1ModerationEventsEventIdApprovePost,
  getListModerationEventsApiV1ModerationEventsGetQueryKey,
  rejectEventApiV1ModerationEventsEventIdRejectPost,
} from "@/shared/api/generated/endpoints/moderation/moderation";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";

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
      showToast(t(isApproved ? "admin.moderation.approved" : "admin.moderation.rejected")),
    onError: (error) =>
      showToast(t(getApiErrorKey(error, "admin.moderation.decisionFailed")), { tone: "error" }),
    onSettled: () =>
      Promise.all(
        [
          getListModerationEventsApiV1ModerationEventsGetQueryKey(),
          getGetEventApiV1EventsEventIdGetQueryKey(eventId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });

  return {
    decide: (decision) => mutation.mutate(decision),
    isPending: mutation.isPending,
  };
}
