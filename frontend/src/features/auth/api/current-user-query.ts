import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/api/errors";
import {
  getCurrentUserProfileApiV1UsersMeGet,
  getGetCurrentUserProfileApiV1UsersMeGetQueryKey,
} from "@/shared/api/generated/endpoints/users/users";
import type { UserRead } from "@/shared/api/generated/model";
import { restoreSession } from "@/features/auth/lib/restore-session";
import { hasAccessToken } from "@/features/auth/lib/session-storage";

const CURRENT_USER_STALE_MS = 5 * 60_000;

/** `GET /users/me`, or `null` for guests. The single source of the signed-in user (API-5). */
export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: getGetCurrentUserProfileApiV1UsersMeGetQueryKey(),
    queryFn: async ({ signal }): Promise<UserRead | null> => {
      await restoreSession();
      return hasAccessToken() ? getCurrentUserProfileApiV1UsersMeGet(undefined, signal) : null;
    },
    staleTime: CURRENT_USER_STALE_MS,
  });
}

/** For route guards: `null` when signed out; network failures still throw (never a logout). */
export async function ensureCurrentUser(queryClient: QueryClient): Promise<UserRead | null> {
  try {
    return await queryClient.ensureQueryData(currentUserQueryOptions());
  } catch (error) {
    if (isApiError(error) && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

/** The user already in the cache (the root route prefetches it), without fetching. */
export function getCachedCurrentUser(queryClient: QueryClient): UserRead | null {
  return queryClient.getQueryData(currentUserQueryOptions().queryKey) ?? null;
}

/** For the root route: warms the cache so the header renders the right state; never throws. */
export async function prefetchCurrentUser(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery(currentUserQueryOptions());
}
