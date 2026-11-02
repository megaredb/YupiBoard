import { createFileRoute } from "@tanstack/react-router";
import { interimAllEventsQueryOptions, pageSearchSchema } from "@/features/events";
import { publicUserQueryOptions } from "@/features/profile";
import { PublicProfilePage } from "@/features/profile/pages/public-profile-page";

export const Route = createFileRoute("/users/$userId")({
  validateSearch: pageSearchSchema,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publicUserQueryOptions(params.userId)),
      context.queryClient.ensureQueryData(interimAllEventsQueryOptions()),
    ]),
  staticData: { titleKey: "profile.public.pageTitle" },
  component: PublicProfilePage,
});
