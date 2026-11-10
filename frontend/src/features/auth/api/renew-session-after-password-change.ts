import type { QueryClient } from "@tanstack/react-query";
import { loginApiV1AuthLoginPost } from "@/shared/api/generated/endpoints/auth/auth";
import { getCachedCurrentUser } from "@/features/auth/api/current-user-query";
import { renewSession } from "@/features/auth/api/session-lifecycle";

/**
 * The backend revokes every refresh token of the account when its password changes, this
 * device's included, so the next token refresh (and the refresh cookie a logout clears) would be
 * dead. Signing in again with the new password replaces them and keeps this session working.
 */
export async function renewSessionAfterPasswordChange(
  queryClient: QueryClient,
  newPassword: string,
): Promise<void> {
  const email = getCachedCurrentUser(queryClient)?.email;
  if (!email) return;
  try {
    await renewSession(
      queryClient,
      await loginApiV1AuthLoginPost({ email, password: newPassword }),
    );
  } catch {
    // The password did change. If signing in again fails (offline), the current access token
    // still works until it expires; then the session ends like any other expired session.
  }
}
