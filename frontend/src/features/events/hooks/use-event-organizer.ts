import { useQuery } from "@tanstack/react-query";
import type { EventRead } from "@/shared/api/generated/model";
import { organizerQueryOptions } from "@/features/events/api/event-queries";
import { formatMemberSince, formatRating, getFullName } from "@/features/users";

export interface EventOrganizer {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: string | null;
  memberSince: string | null;
}

/** Summary from the event, enriched with the organizer's profile once it has loaded. */
export function useEventOrganizer(event: EventRead): EventOrganizer {
  const { data: profile } = useQuery(organizerQueryOptions(event.organizer.id));
  return {
    id: event.organizer.id,
    name: (profile && getFullName(profile)) ?? event.organizer.name,
    avatarUrl: profile?.avatar_url ?? null,
    rating: formatRating(profile?.rating_as_organizer ?? event.organizer.rating_as_organizer),
    memberSince: formatMemberSince(profile?.created_at),
  };
}
