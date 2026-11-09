import { createFileRoute } from "@tanstack/react-router";
import { myParticipatingEventsQueryOptions, pageSearchSchema } from "@/features/events";
import { MyBookingsPage } from "@/features/events/pages/my-bookings-page";

export const Route = createFileRoute("/_authenticated/my-bookings")({
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.query({
      ...myParticipatingEventsQueryOptions(deps.page),
      staleTime: "static",
    }),
  staticData: { titleKey: "events.myBookings.title" },
  component: MyBookingsPage,
});
