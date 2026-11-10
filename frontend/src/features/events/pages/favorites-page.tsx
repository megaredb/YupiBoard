import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EventCollection } from "@/features/events/components/event-collection";
import { EventList } from "@/features/events/components/event-list";
import { useFavoriteEvents } from "@/features/events/hooks/use-favorite-events";

const route = getRouteApi("/_authenticated/favorites");

export function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page } = route.useSearch();
  const events = useFavoriteEvents(page);
  const handlePageChange = (next: number) =>
    void navigate({ to: "/favorites", search: { page: next } });

  return (
    <EventCollection
      title={t("events.favorites.title")}
      results={events}
      page={page}
      onPageChange={handlePageChange}
    >
      <EventList
        state={events.list}
        isRefreshing={events.isRefreshing}
        empty={{
          title: t("events.favorites.emptyTitle"),
          description: t("events.favorites.emptyDescription"),
        }}
        showOrganizer
      />
    </EventCollection>
  );
}
