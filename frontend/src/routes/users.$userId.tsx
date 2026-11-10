import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
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
      loadQuery(context.queryClient, publicUserQueryOptions(params.userId)),
      loadQuery(context.queryClient, hostedEventsQueryOptions(params.userId, deps.page)),
    ]),
  staticData: { titleKey: "profile.public.pageTitle" },
  component: PublicProfilePage,
});
