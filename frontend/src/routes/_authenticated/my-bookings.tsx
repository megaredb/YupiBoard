import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import {
  myParticipatingEventsQueryOptions,
  PAGE_SEARCH_DEFAULTS,
  pageSearchSchema,
} from "@/features/events";
import { MyBookingsPage } from "@/features/events/pages/my-bookings-page";

export const Route = createFileRoute("/_authenticated/my-bookings")({
  validateSearch: pageSearchSchema,
  search: { middlewares: [stripSearchParams(PAGE_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    loadQuery(context.queryClient, myParticipatingEventsQueryOptions(deps.page)),
  staticData: { titleKey: "events.myBookings.title" },
  component: MyBookingsPage,
});
