import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { CATALOG_SEARCH_DEFAULTS, catalogSearchSchema, loadCatalog } from "@/features/events";
import { EventCatalogPage } from "@/features/events/pages/event-catalog-page";

export const Route = createFileRoute("/events/")({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadCatalog(context.queryClient, deps),
  staticData: { titleKey: "shell.nav.events" },
  component: EventCatalogPage,
});
