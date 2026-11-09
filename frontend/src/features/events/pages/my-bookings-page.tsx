import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EventCollection } from "@/features/events/components/event-collection";
import { useMyParticipatingEvents } from "@/features/events/hooks/use-my-participating-events";

const route = getRouteApi("/_authenticated/my-bookings");

export function MyBookingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page } = route.useSearch();
  const events = useMyParticipatingEvents(page);
  const handlePageChange = (next: number) =>
    void navigate({ to: "/my-bookings", search: { page: next } });

  return (
    <EventCollection
      title={t("events.myBookings.title")}
      events={events}
      page={page}
      onPageChange={handlePageChange}
      empty={{
        title: t("events.myBookings.emptyTitle"),
        description: t("events.myBookings.emptyDescription"),
      }}
      showOrganizer
    />
  );
}
