import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
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
    context.queryClient.query({
      ...myParticipatingEventsQueryOptions(deps.page),
      staleTime: "static",
    }),
  staticData: { titleKey: "events.myBookings.title" },
  component: MyBookingsPage,
});
