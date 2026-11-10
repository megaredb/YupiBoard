import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  getGetEventApiV1EventsEventIdGetQueryKey,
  getListEventsApiV1EventsGetQueryKey,
  getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey,
} from "@/shared/api/generated/endpoints/events/events";
import {
  addFavoriteApiV1EventsEventIdFavoritePost,
  getListFavoritesApiV1UsersMeFavoritesGetQueryKey,
  removeFavoriteApiV1EventsEventIdFavoriteDelete,
} from "@/shared/api/generated/endpoints/favorites/favorites";
import type { EventRead } from "@/shared/api/generated/model";
import { showToast } from "@/shared/lib/toast/toast-store";
import { useCurrentUser } from "@/features/auth";

interface FavoriteToggle {
  isFavorite: boolean;
  toggleFavorite: () => void;
}

export function useFavoriteToggle(event: Pick<EventRead, "id" | "is_favorite">): FavoriteToggle {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const currentHref = useLocation({ select: (location) => location.href });

  const mutation = useMutation({
    mutationFn: (isFavorite: boolean) =>
      isFavorite
        ? addFavoriteApiV1EventsEventIdFavoritePost(event.id)
        : removeFavoriteApiV1EventsEventIdFavoriteDelete(event.id),
    onSuccess: (_, isAdded) =>
      showToast(isAdded ? t("events.favorites.added") : t("events.favorites.removed")),
    onError: () => showToast(t("events.favorites.toggleFailed"), { tone: "error" }),
    // Every list that carries `is_favorite` is refreshed, so cards agree with the details page.
    onSettled: () =>
      Promise.all(
        [
          getGetEventApiV1EventsEventIdGetQueryKey(event.id),
          getListFavoritesApiV1UsersMeFavoritesGetQueryKey(),
          getListEventsApiV1EventsGetQueryKey(),
          getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey(),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });

  // While the request runs, show the state the user asked for.
  const isFavorite = mutation.isPending ? mutation.variables : (event.is_favorite ?? false);

  const toggleFavorite = () => {
    if (!user) {
      void navigate({ to: "/login", search: { redirect: currentHref } });
      return;
    }
    if (!mutation.isPending) mutation.mutate(!isFavorite);
  };
  return { isFavorite, toggleFavorite };
}
