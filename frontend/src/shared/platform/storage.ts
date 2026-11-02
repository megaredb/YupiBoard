import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "@/shared/platform/is-native";

const KEY_PREFIX = "yupiboard";

interface KeyValueStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
  keys: () => Promise<string[]>;
}

const webStorage: KeyValueStorage = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
  keys: async () => Object.keys(localStorage),
};

const nativeStorage: KeyValueStorage = {
  get: async (key) => (await Preferences.get({ key })).value,
  set: (key, value) => Preferences.set({ key, value }),
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

export async function readUserValue(userId: string, key: string): Promise<string | null> {
  return backend().get(userKey(userId, key));
}

export async function writeUserValue(userId: string, key: string, value: string): Promise<void> {
  await backend().set(userKey(userId, key), value);
}

/** Wipes everything stored for `userId`; called on logout and session expiry. */
export async function clearUserData(userId: string): Promise<void> {
  const storage = backend();
  const prefix = userKey(userId, "");
  const keys = await storage.keys();
  await Promise.all(keys.filter((key) => key.startsWith(prefix)).map((key) => storage.remove(key)));
}
