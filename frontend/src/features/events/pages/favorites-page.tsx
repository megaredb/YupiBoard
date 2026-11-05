import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EventCollection } from "@/features/events/components/event-collection";
import { useSavedEventList } from "@/features/events/hooks/use-saved-event-list";

const route = getRouteApi("/_authenticated/favorites");

export function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page } = route.useSearch();
  const events = useSavedEventList("favorites", page);
  const handlePageChange = (next: number) =>
    void navigate({ to: "/favorites", search: { page: next } });

  return (
    <EventCollection
      title={t("events.favorites.title")}
      events={events}
      page={page}
      onPageChange={handlePageChange}
      empty={{
        title: t("events.favorites.emptyTitle"),
        description: t("events.favorites.emptyDescription"),
      }}
      showOrganizer
    />
  );
}
