import { restoreSessionFromRefreshToken } from "@/shared/api/client"
import { hasAccessToken, loadStoredTokens } from "@/features/auth/lib/session-storage"

let restoring: Promise<void> | null = null

async function restore(): Promise<void> {
  await loadStoredTokens()
  // Web never persists the access token, so every page load asks the refresh cookie for one.
  if (!hasAccessToken()) await restoreSessionFromRefreshToken()
}

/** Resolves once a stored or cookie-based session (if any) has been picked up. Runs once. */
export function restoreSession(): Promise<void> {
  restoring ??= restore()
  return restoring
}
