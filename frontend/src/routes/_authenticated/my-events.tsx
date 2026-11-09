import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
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
    context.queryClient.query({ ...myCreatedEventsQueryOptions(deps.page), staleTime: "static" }),
  staticData: { titleKey: "events.myEvents.title" },
  component: MyEventsPage,
});
