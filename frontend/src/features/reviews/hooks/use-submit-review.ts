import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getGetEventApiV1EventsEventIdGetQueryKey } from "@/shared/api/generated/endpoints/events/events";
import {
  getGetMyEventReviewsApiV1EventsEventIdReviewsMeGetQueryKey,
  rateOrganizerApiV1EventsEventIdReviewsOrganizerPut,
  ratePlayerApiV1EventsEventIdReviewsPlayersUserIdPut,
} from "@/shared/api/generated/endpoints/reviews/reviews";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { showToast } from "@/shared/lib/toast/toast-store";

/** Who is being rated: the organizer, or one of the players (rated by the organizer). */
export type ReviewTarget = { role: "organizer" } | { role: "player"; userId: string };

interface SubmitReview {
  submit: (target: ReviewTarget, score: number, onDone: () => void) => void;
  isPending: boolean;
}

export function useSubmitReview(eventId: string): SubmitReview {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ target, score }: { target: ReviewTarget; score: number }) =>
      target.role === "organizer"
        ? rateOrganizerApiV1EventsEventIdReviewsOrganizerPut(eventId, { score })
        : ratePlayerApiV1EventsEventIdReviewsPlayersUserIdPut(eventId, target.userId, { score }),
    onSuccess: () => showToast(t("reviews.saved")),
    onError: (error) =>
      showToast(t(getApiErrorKey(error, "reviews.saveFailed")), { tone: "error" }),
    onSettled: () =>
      Promise.all(
        [
          getGetMyEventReviewsApiV1EventsEventIdReviewsMeGetQueryKey(eventId),
          getGetEventApiV1EventsEventIdGetQueryKey(eventId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });

  return {
    submit: (target, score, onDone) => mutation.mutate({ target, score }, { onSuccess: onDone }),
    isPending: mutation.isPending,
  };
}
