import type { QueryClient } from "@tanstack/react-query";
import { getCachedCurrentUser } from "@/features/auth";
import { loadSavedEvents } from "@/features/saved-events/lib/saved-events-store";

/** Route `loader` helper: makes the signed-in user's saved ids available before render. */
export async function ensureSavedEvents(queryClient: QueryClient): Promise<void> {
  await loadSavedEvents(getCachedCurrentUser(queryClient)?.id ?? null);
}
