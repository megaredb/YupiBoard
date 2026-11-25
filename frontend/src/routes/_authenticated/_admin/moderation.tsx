import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  loadModerationQueue,
  MODERATION_SEARCH_DEFAULTS,
  ModerationQueuePage,
  moderationSearchSchema,
} from "@/features/moderation";

export const Route = createFileRoute("/_authenticated/_admin/moderation")({
  validateSearch: moderationSearchSchema,
  search: { middlewares: [stripSearchParams(MODERATION_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadModerationQueue(context.queryClient, deps),
  staticData: { titleKey: "moderation.title" },
  component: ModerationQueuePage,
});
