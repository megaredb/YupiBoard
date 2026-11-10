import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import {
  myCreatedEventsQueryOptions,
  myEventsSearchSchema,
  PERSONAL_LIST_SEARCH_DEFAULTS,
} from "@/features/events";
import { MyEventsPage } from "@/features/events/pages/my-events-page";

export const Route = createFileRoute("/_authenticated/my-events")({
  validateSearch: myEventsSearchSchema,
  search: { middlewares: [stripSearchParams(PERSONAL_LIST_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadQuery(context.queryClient, myCreatedEventsQueryOptions(deps)),
  staticData: { titleKey: "events.myEvents.title" },
  component: MyEventsPage,
});
