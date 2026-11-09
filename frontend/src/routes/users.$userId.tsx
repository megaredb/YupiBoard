import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  hostedEventsQueryOptions,
  PAGE_SEARCH_DEFAULTS,
  pageSearchSchema,
} from "@/features/events";
import { publicUserQueryOptions } from "@/features/profile";
import { PublicProfilePage } from "@/features/profile/pages/public-profile-page";

export const Route = createFileRoute("/users/$userId")({
  validateSearch: pageSearchSchema,
  search: { middlewares: [stripSearchParams(PAGE_SEARCH_DEFAULTS)] },
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
