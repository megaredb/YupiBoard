import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getGetEventApiV1EventsEventIdGetQueryKey } from "@/shared/api/generated/endpoints/events/events";
import {
  addFavoriteApiV1EventsEventIdFavoritePost,
  getListFavoritesApiV1UsersMeFavoritesGetQueryKey,
  removeFavoriteApiV1EventsEventIdFavoriteDelete,
} from "@/shared/api/generated/endpoints/favorites/favorites";
import type { EventRead } from "@/shared/api/generated/model";
import { useCurrentUser } from "@/features/auth";

interface FavoriteToggle {
  isFavorite: boolean;
  toggleFavorite: () => void;
}

/** Guests are sent to sign in first, since favorites belong to an account. */
export function useFavoriteToggle(event: Pick<EventRead, "id" | "is_favorite">): FavoriteToggle {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  const mutation = useMutation({
    mutationFn: (isFavorite: boolean) =>
      isFavorite
        ? addFavoriteApiV1EventsEventIdFavoritePost(event.id)
        : removeFavoriteApiV1EventsEventIdFavoriteDelete(event.id),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetEventApiV1EventsEventIdGetQueryKey(event.id),
        }),
        queryClient.invalidateQueries({
          queryKey: getListFavoritesApiV1UsersMeFavoritesGetQueryKey(),
        }),
      ]),
  });

  // While the request runs, show the state the user asked for.
  const isFavorite = mutation.isPending ? mutation.variables : (event.is_favorite ?? false);

  const toggleFavorite = () => {
    if (!user) {
      void navigate({ to: "/login", search: { redirect: `/events/${event.id}` } });
      return;
    }
    if (!mutation.isPending) mutation.mutate(!isFavorite);
  };
  return { isFavorite, toggleFavorite };
}
