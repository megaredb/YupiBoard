import { createFileRoute } from "@tanstack/react-router";
import { hostedEventsQueryOptions, pageSearchSchema } from "@/features/events";
import { publicUserQueryOptions } from "@/features/profile";
import { PublicProfilePage } from "@/features/profile/pages/public-profile-page";

export const Route = createFileRoute("/users/$userId")({
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, params, deps }) =>
    Promise.all([
      context.queryClient.query({ ...publicUserQueryOptions(params.userId), staleTime: "static" }),
      context.queryClient.query({
        ...hostedEventsQueryOptions(params.userId, deps.page),
        staleTime: "static",
      }),
    ]),
  staticData: { titleKey: "profile.public.pageTitle" },
  component: PublicProfilePage,
});
