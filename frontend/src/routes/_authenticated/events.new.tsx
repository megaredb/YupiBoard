import { createFileRoute } from "@tanstack/react-router";
import { CreateEventPage } from "@/features/events/pages/create-event-page";
import { citiesQueryOptions } from "@/features/locations";

export const Route = createFileRoute("/_authenticated/events/new")({
  loader: ({ context }) =>
    context.queryClient.query({ ...citiesQueryOptions(), staleTime: "static" }),
  staticData: { layout: "standalone", titleKey: "events.create.title" },
  component: CreateEventPage,
});
