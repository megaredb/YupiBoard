import type { SessionTokens, TokenStore } from "@/shared/api/client";
import { isNativePlatform } from "@/shared/platform/is-native";
import {
  readSecureValue,
  removeSecureValue,
  writeSecureValue,
} from "@/shared/platform/secure-storage";

// In-memory copy so the API client can read tokens synchronously.
let accessToken: string | null = null;
let refreshToken: string | null = null;

async function saveTokens(tokens: SessionTokens): Promise<void> {
  accessToken = tokens.accessToken;
  await writeSecureValue("access_token", tokens.accessToken);
  // Web keeps the refresh token in an HttpOnly cookie; only native stores it (PLAT-5).
  if (isNativePlatform() && tokens.refreshToken) {
    refreshToken = tokens.refreshToken;
    await writeSecureValue("refresh_token", tokens.refreshToken);
  }
}

async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([removeSecureValue("access_token"), removeSecureValue("refresh_token")]);
}

/** The one place tokens are handled; handed to the API client in `bootstrap()`. */
export const sessionTokenStore: TokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  save: saveTokens,
  clear: clearTokens,
};

export async function loadStoredTokens(): Promise<void> {
  const [storedAccess, storedRefresh] = await Promise.all([
    readSecureValue("access_token"),
    readSecureValue("refresh_token"),
  ]);
  accessToken = storedAccess;
  refreshToken = storedRefresh;
}

export function hasAccessToken(): boolean {
  return accessToken !== null;
}
