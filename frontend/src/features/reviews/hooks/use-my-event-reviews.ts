import { useQuery } from "@tanstack/react-query";
import { myEventReviewsQueryOptions } from "@/features/reviews/api/review-queries";

interface MyEventReviews {
  canReview: boolean;
  reviewDeadline: string | null;
  organizerScore: number | null;
  getPlayerScore: (userId: string) => number | null;
}

/** What the signed-in user may rate on this event, and what they have already rated. */
export function useMyEventReviews(eventId: string, enabled: boolean): MyEventReviews {
  const { data } = useQuery({ ...myEventReviewsQueryOptions(eventId), enabled });
  const reviews = data?.reviews ?? [];

  return {
    canReview: data?.can_review ?? false,
    reviewDeadline: data?.review_deadline ?? null,
    organizerScore: reviews.find((review) => review.target_role === "Organizer")?.score ?? null,
    getPlayerScore: (userId) =>
      reviews.find((review) => review.target_role === "Player" && review.reviewee_id === userId)
        ?.score ?? null,
  };
}
