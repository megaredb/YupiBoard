import { createFileRoute } from "@tanstack/react-router";
import { catalogQueryOptions, catalogSearchSchema } from "@/features/events";
import { EventCatalogPage } from "@/features/events/pages/event-catalog-page";

export const Route = createFileRoute("/events/")({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query({
      ...catalogQueryOptions({ city: deps.city, distance: deps.distance }, deps.page),
      staleTime: "static",
    }),
  staticData: { titleKey: "shell.nav.events" },
  component: EventCatalogPage,
});
