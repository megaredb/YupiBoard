import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import {
  EVENT_DETAILS_SEARCH_DEFAULTS,
  eventDetailsQueryOptions,
  eventDetailsSearchSchema,
  EventDetailsSkeleton,
} from "@/features/events";
import { EventDetailsPage } from "@/features/events/pages/event-details-page";

export const Route = createFileRoute("/events/$eventId")({
  validateSearch: eventDetailsSearchSchema,
  search: { middlewares: [stripSearchParams(EVENT_DETAILS_SEARCH_DEFAULTS)] },
  loader: ({ context, params }) =>
    loadQuery(context.queryClient, eventDetailsQueryOptions(params.eventId)),
  pendingComponent: EventDetailsSkeleton,
  staticData: { layout: "immersive", titleKey: "events.details.pageTitle" },
  component: EventDetailsPage,
});
