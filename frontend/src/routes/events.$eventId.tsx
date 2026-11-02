import { createFileRoute } from "@tanstack/react-router"
import { EventDetailsSkeleton, eventDetailsQueryOptions } from "@/features/events"
import { EventDetailsPage } from "@/features/events/pages/event-details-page"
import { ensureSavedEvents } from "@/features/saved-events"

export const Route = createFileRoute("/events/$eventId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(eventDetailsQueryOptions(params.eventId)),
      ensureSavedEvents(context.queryClient),
    ]),
  pendingComponent: EventDetailsSkeleton,
  staticData: { layout: "immersive", titleKey: "events.details.pageTitle" },
  component: EventDetailsPage,
})
