import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "@/shared/platform/is-native";

const KEY_PREFIX = "yupiboard";

interface KeyValueStorage {
  remove: (key: string) => Promise<void>;
  keys: () => Promise<string[]>;
}

const webStorage: KeyValueStorage = {
  remove: async (key) => localStorage.removeItem(key),
  keys: async () => Object.keys(localStorage),
};

const nativeStorage: KeyValueStorage = {
  remove: (key) => Preferences.remove({ key }),
  keys: async () => (await Preferences.keys()).keys,
};

function backend(): KeyValueStorage {
  return isNativePlatform() ? nativeStorage : webStorage;
}

/** Every on-device user value is namespaced `yupiboard:<userId>:<key>` (PLAT-5). */
function userKey(userId: string, key: string): string {
  return `${KEY_PREFIX}:${userId}:${key}`;
}

export async function clearUserData(userId: string): Promise<void> {
  const storage = backend();
  const prefix = userKey(userId, "");
  const keys = await storage.keys();
  await Promise.all(keys.filter((key) => key.startsWith(prefix)).map((key) => storage.remove(key)));
}
