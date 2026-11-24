import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { loadQuery } from "@/shared/api/load-query";
import {
  MODERATION_SEARCH_DEFAULTS,
  ModerationQueuePage,
  moderationQueueQueryOptions,
  moderationSearchSchema,
} from "@/features/moderation";

export const Route = createFileRoute("/_authenticated/_admin/moderation")({
  validateSearch: moderationSearchSchema,
  search: { middlewares: [stripSearchParams(MODERATION_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  loader: ({ context, deps }) =>
    loadQuery(context.queryClient, moderationQueueQueryOptions(deps.tab)),
  staticData: { titleKey: "admin.moderation.title" },
  component: ModerationQueuePage,
});
