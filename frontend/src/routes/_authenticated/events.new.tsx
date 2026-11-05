import { createFileRoute } from "@tanstack/react-router";
import { CreateEventPage } from "@/features/events/pages/create-event-page";

export const Route = createFileRoute("/_authenticated/events/new")({
  staticData: { layout: "standalone", titleKey: "events.create.title" },
  component: CreateEventPage,
});
