import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "@/shared/platform/is-native";

export type SecureKey = "access_token" | "refresh_token";

// Web: nothing is persisted. The refresh token lives in an HttpOnly cookie and the access token
// only in memory, so a reload restores the session through the refresh endpoint.
const memory = new Map<SecureKey, string>();

const KEY_PREFIX = "yupiboard:secure:";

export async function readSecureValue(key: SecureKey): Promise<string | null> {
  if (!isNativePlatform()) return memory.get(key) ?? null;
  return (await Preferences.get({ key: `${KEY_PREFIX}${key}` })).value;
}

export async function writeSecureValue(key: SecureKey, value: string): Promise<void> {
  if (!isNativePlatform()) {
    memory.set(key, value);
    return;
  }
  await Preferences.set({ key: `${KEY_PREFIX}${key}`, value });
}

export async function removeSecureValue(key: SecureKey): Promise<void> {
  if (!isNativePlatform()) {
    memory.delete(key);
    return;
  }
  await Preferences.remove({ key: `${KEY_PREFIX}${key}` });
}
