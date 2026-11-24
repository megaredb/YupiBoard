import type { QueryClient } from "@tanstack/react-query";
import { loadQuery } from "@/shared/api/load-query";
import { getCachedCurrentUser } from "@/features/auth";
import { citiesQueryOptions, getPreferredCity } from "@/features/locations";
import { moderationQueueQueryOptions } from "@/features/moderation/api/moderation-queries";
import type { ModerationSearch } from "@/features/moderation/schemas/moderation-search.schema";

/** Loader of `/moderation`: distance is measured from the moderator's city, so cities load first. */
export async function loadModerationQueue(
  queryClient: QueryClient,
  search: ModerationSearch,
): Promise<void> {
  const cities = await loadQuery(queryClient, citiesQueryOptions());
  const origin = cities && getPreferredCity(cities, getCachedCurrentUser(queryClient)?.city);
  await loadQuery(queryClient, moderationQueueQueryOptions(search, origin));
}
