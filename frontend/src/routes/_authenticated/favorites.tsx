import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import {
  favoriteEventsQueryOptions,
  PAGE_SEARCH_DEFAULTS,
  pageSearchSchema,
} from "@/features/events";
import { FavoritesPage } from "@/features/events/pages/favorites-page";

export const Route = createFileRoute("/_authenticated/favorites")({
  validateSearch: pageSearchSchema,
  search: { middlewares: [stripSearchParams(PAGE_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    loadQuery(context.queryClient, favoriteEventsQueryOptions(deps.page)),
  staticData: { titleKey: "events.favorites.title" },
  component: FavoritesPage,
});
