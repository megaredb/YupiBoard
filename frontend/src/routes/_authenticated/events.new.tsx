import { createFileRoute } from "@tanstack/react-router";
import { citiesQueryOptions } from "@/features/events";
import { CreateEventPage } from "@/features/events/pages/create-event-page";

export const Route = createFileRoute("/_authenticated/events/new")({
  loader: ({ context }) =>
    context.queryClient.query({ ...citiesQueryOptions(), staleTime: "static" }),
  staticData: { layout: "standalone", titleKey: "events.create.title" },
  component: CreateEventPage,
});
