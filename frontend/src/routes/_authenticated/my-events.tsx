import { createFileRoute } from "@tanstack/react-router";
import { myCreatedEventsQueryOptions, pageSearchSchema } from "@/features/events";
import { MyEventsPage } from "@/features/events/pages/my-events-page";

export const Route = createFileRoute("/_authenticated/my-events")({
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.query({ ...myCreatedEventsQueryOptions(deps.page), staleTime: "static" }),
  staticData: { titleKey: "events.myEvents.title" },
  component: MyEventsPage,
});
