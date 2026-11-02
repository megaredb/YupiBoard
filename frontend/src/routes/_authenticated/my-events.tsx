import { createFileRoute } from "@tanstack/react-router";
import { interimAllEventsQueryOptions, pageSearchSchema } from "@/features/events";
import { MyEventsPage } from "@/features/events/pages/my-events-page";

export const Route = createFileRoute("/_authenticated/my-events")({
  validateSearch: pageSearchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(interimAllEventsQueryOptions()),
  staticData: { titleKey: "events.myEvents.title" },
  component: MyEventsPage,
});
