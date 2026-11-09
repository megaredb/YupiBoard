import { createFileRoute } from "@tanstack/react-router";
import { eventDetailsQueryOptions, EventDetailsSkeleton } from "@/features/events";
import { EventDetailsPage } from "@/features/events/pages/event-details-page";

export const Route = createFileRoute("/events/$eventId")({
  loader: ({ context, params }) =>
    context.queryClient.query({ ...eventDetailsQueryOptions(params.eventId), staleTime: "static" }),
  pendingComponent: EventDetailsSkeleton,
  staticData: { layout: "immersive", titleKey: "events.details.pageTitle" },
  component: EventDetailsPage,
});
