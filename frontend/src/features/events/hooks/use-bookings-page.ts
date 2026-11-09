import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { PARTICIPANTS_SECTION_ID } from "@/features/events/lib/participants-section-id";

const route = getRouteApi("/events/$eventId");

export function useBookingsPage(): { page: number; goToPage: (page: number) => void } {
  const { eventId } = route.useParams();
  const { bookingsPage } = route.useSearch();
  const navigate = useNavigate();

  return {
    page: bookingsPage,
    goToPage: (page) =>
      void navigate({
        to: "/events/$eventId",
        params: { eventId },
        search: { bookingsPage: page },
        hash: PARTICIPANTS_SECTION_ID,
        resetScroll: false,
      }),
  };
}
