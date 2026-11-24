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

interface Decision {
  isApproved: boolean;
  reason?: string;
}

interface ModerateEvent {
  decide: (isApproved: boolean, reason?: string) => void;
  isPending: boolean;
}

export function useModerateEvent(eventId: string): ModerateEvent {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ isApproved, reason }: Decision) =>
      isApproved
        ? approveEventApiV1ModerationEventsEventIdApprovePost(eventId)
        : rejectEventApiV1ModerationEventsEventIdRejectPost(eventId, { reason: reason ?? "" }),
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
    decide: (isApproved, reason) => mutation.mutate({ isApproved, reason }),
    isPending: mutation.isPending,
  };
}
