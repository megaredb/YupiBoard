import { hashKey, type QueryClient } from "@tanstack/react-query";
import type { TokenResponse, UserRead } from "@/shared/api/generated/model";
import { clearUserData } from "@/shared/platform/storage";
import { currentUserQueryOptions } from "@/features/auth/api/current-user-query";
import { sessionTokenStore } from "@/features/auth/lib/session-storage";

export class AccountBannedError extends Error {
  constructor() {
    super("Account is banned");
    this.name = "AccountBannedError";
  }
}

/**
 * Responses cached for one account (`is_favorite`, "my" lists) must not leak into the next one,
 * so everything but the current user query is dropped when the account changes.
 */
function dropAccountScopedQueries(queryClient: QueryClient): void {
  const currentUserHash = hashKey(currentUserQueryOptions().queryKey);
  queryClient.removeQueries({ predicate: (query) => query.queryHash !== currentUserHash });
}

export async function renewSession(
  queryClient: QueryClient,
  response: TokenResponse,
): Promise<UserRead> {
  if (response.user.status === "Banned") throw new AccountBannedError();
  await sessionTokenStore.save({
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? null,
  });
  queryClient.setQueryData(currentUserQueryOptions().queryKey, response.user);
  return response.user;
}

export async function startSession(
  queryClient: QueryClient,
  response: TokenResponse,
): Promise<UserRead> {
  const user = await renewSession(queryClient, response);
  dropAccountScopedQueries(queryClient);
  return user;
}

export async function endSession(queryClient: QueryClient): Promise<void> {
  const userId = queryClient.getQueryData(currentUserQueryOptions().queryKey)?.id ?? null;
  await sessionTokenStore.clear();
  if (userId) await clearUserData(userId);
  queryClient.setQueryData(currentUserQueryOptions().queryKey, null);
  dropAccountScopedQueries(queryClient);
}
