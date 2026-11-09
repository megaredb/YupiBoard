import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import {
  myBookingsQueryOptions,
  myBookingsSearchSchema,
  PERSONAL_LIST_SEARCH_DEFAULTS,
} from "@/features/events";
import { MyBookingsPage } from "@/features/events/pages/my-bookings-page";

export const Route = createFileRoute("/_authenticated/my-bookings")({
  validateSearch: myBookingsSearchSchema,
  search: { middlewares: [stripSearchParams(PERSONAL_LIST_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadQuery(context.queryClient, myBookingsQueryOptions(deps)),
  staticData: { titleKey: "events.myBookings.title" },
  component: MyBookingsPage,
});
