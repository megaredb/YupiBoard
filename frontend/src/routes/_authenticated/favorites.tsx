import { createFileRoute } from "@tanstack/react-router"
import { interimAllEventsQueryOptions, pageSearchSchema } from "@/features/events"
import { FavoritesPage } from "@/features/events/pages/favorites-page"
import { ensureSavedEvents } from "@/features/saved-events"

export const Route = createFileRoute("/_authenticated/favorites")({
  validateSearch: pageSearchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(interimAllEventsQueryOptions()),
      ensureSavedEvents(context.queryClient),
    ]),
  staticData: { titleKey: "events.favorites.title" },
  component: FavoritesPage,
})
