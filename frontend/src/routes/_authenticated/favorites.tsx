import { createFileRoute } from "@tanstack/react-router";
import { favoriteEventsQueryOptions, pageSearchSchema } from "@/features/events";
import { FavoritesPage } from "@/features/events/pages/favorites-page";

export const Route = createFileRoute("/_authenticated/favorites")({
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.query({ ...favoriteEventsQueryOptions(deps.page), staleTime: "static" }),
  staticData: { titleKey: "events.favorites.title" },
  component: FavoritesPage,
});
