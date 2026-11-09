import { useQuery } from "@tanstack/react-query";
import { getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryOptions } from "@/shared/api/generated/endpoints/bookings/bookings";
import type { BookingParticipantSummary } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";

export function useEventParticipants(eventId: string): ListState<BookingParticipantSummary> {
  const query = useQuery(
    getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryOptions(eventId),
  );
  return toListState(query, query.data);
}
