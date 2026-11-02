import { createFileRoute } from "@tanstack/react-router";
import { interimAllEventsQueryOptions, pageSearchSchema } from "@/features/events";
import { MyBookingsPage } from "@/features/events/pages/my-bookings-page";
import { ensureSavedEvents } from "@/features/saved-events";

export const Route = createFileRoute("/_authenticated/my-bookings")({
  validateSearch: pageSearchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(interimAllEventsQueryOptions()),
      ensureSavedEvents(context.queryClient),
    ]),
  staticData: { titleKey: "events.myBookings.title" },
  component: MyBookingsPage,
});
