import type { QueryClient } from "@tanstack/react-query";
import { loadQuery } from "@/shared/api/load-query";
import { moderationQueueQueryOptions } from "@/features/moderation/api/moderation-queries";
import type { ModerationSearch } from "@/features/moderation/schemas/moderation-search.schema";

export async function loadModerationQueue(
  queryClient: QueryClient,
  search: ModerationSearch,
): Promise<void> {
  await loadQuery(queryClient, moderationQueueQueryOptions(search));
}
