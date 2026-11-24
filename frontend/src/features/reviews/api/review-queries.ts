import { queryOptions } from "@tanstack/react-query";
import {
  getGetMyEventReviewsApiV1EventsEventIdReviewsMeGetQueryKey,
  getMyEventReviewsApiV1EventsEventIdReviewsMeGet,
} from "@/shared/api/generated/endpoints/reviews/reviews";

/** Built from the generated key and fetcher so it can be shared and invalidated by key. */
export function myEventReviewsQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: getGetMyEventReviewsApiV1EventsEventIdReviewsMeGetQueryKey(eventId),
    queryFn: ({ signal }) =>
      getMyEventReviewsApiV1EventsEventIdReviewsMeGet(eventId, undefined, signal),
  });
}
