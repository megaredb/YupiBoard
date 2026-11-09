import { createFileRoute } from "@tanstack/react-router";
import { catalogSearchSchema, loadCatalog } from "@/features/events";
import { EventCatalogPage } from "@/features/events/pages/event-catalog-page";

export const Route = createFileRoute("/events/")({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadCatalog(context.queryClient, deps),
  staticData: { titleKey: "shell.nav.events" },
  component: EventCatalogPage,
});
