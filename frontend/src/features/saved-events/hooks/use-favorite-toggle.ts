import { useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/features/auth";
import { setEventSaved, useSavedEventsStore } from "@/features/saved-events/lib/saved-events-store";

interface FavoriteToggle {
  isFavorite: boolean;
  toggleFavorite: () => void;
}

/** Guests are sent to sign in first, since favorites are kept per user. */
export function useFavoriteToggle(eventId: string): FavoriteToggle {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const isFavorite = useSavedEventsStore((state) => state.favorites.includes(eventId));

  const toggleFavorite = () => {
    if (!user) {
      void navigate({ to: "/login", search: { redirect: `/events/${eventId}` } });
      return;
    }
    void setEventSaved("favorites", eventId, !isFavorite);
  };
  return { isFavorite, toggleFavorite };
}
