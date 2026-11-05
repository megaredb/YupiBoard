import { createFileRoute } from "@tanstack/react-router";
import { eventDetailsQueryOptions, EventDetailsSkeleton } from "@/features/events";
import { EventDetailsPage } from "@/features/events/pages/event-details-page";
import { ensureSavedEvents } from "@/features/saved-events";

export const Route = createFileRoute("/events/$eventId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.query({
        ...eventDetailsQueryOptions(params.eventId),
        staleTime: "static",
      }),
      ensureSavedEvents(context.queryClient),
    ]),
  pendingComponent: EventDetailsSkeleton,
  staticData: { layout: "immersive", titleKey: "events.details.pageTitle" },
  component: EventDetailsPage,
});
