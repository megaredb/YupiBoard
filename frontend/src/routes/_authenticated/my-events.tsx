import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import {
  myCreatedEventsQueryOptions,
  PAGE_SEARCH_DEFAULTS,
  pageSearchSchema,
} from "@/features/events";
import { MyEventsPage } from "@/features/events/pages/my-events-page";

export const Route = createFileRoute("/_authenticated/my-events")({
  validateSearch: pageSearchSchema,
  search: { middlewares: [stripSearchParams(PAGE_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    loadQuery(context.queryClient, myCreatedEventsQueryOptions(deps.page)),
  staticData: { titleKey: "events.myEvents.title" },
  component: MyEventsPage,
});
