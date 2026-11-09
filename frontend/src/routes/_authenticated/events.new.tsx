import { createFileRoute } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import { CreateEventPage } from "@/features/events/pages/create-event-page";
import { citiesQueryOptions } from "@/features/locations";

export const Route = createFileRoute("/_authenticated/events/new")({
  loader: ({ context }) => loadQuery(context.queryClient, citiesQueryOptions()),
  staticData: { layout: "immersive", titleKey: "events.create.title" },
  component: CreateEventPage,
});
