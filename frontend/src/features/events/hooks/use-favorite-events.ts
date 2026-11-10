import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FavoritePage } from "@/shared/api/generated/model";
import { favoriteEventsQueryOptions } from "@/features/events/api/event-queries";
import { toPagedList, type PagedEvents } from "@/features/events/lib/to-paged-list";

// `GET /users/me/favorites` sends `is_favorite: false` for its items, although every one of them
// is a favorite by definition; the card hearts would otherwise show them as not saved.
function markAllFavorite(page: FavoritePage): FavoritePage {
  return { ...page, items: page.items.map((event) => ({ ...event, is_favorite: true })) };
}

export function useFavoriteEvents(page: number): PagedEvents {
  const query = useQuery({
    ...favoriteEventsQueryOptions(page),
    select: markAllFavorite,
    placeholderData: keepPreviousData,
  });
  return toPagedList(query);
}
