// A device setting like the theme, not user data, so it is not namespaced per user (PLAT-5).
const STORAGE_KEY = "yupiboard:language";

export function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode); the device language is used instead.
    return null;
  }
}

export function storeLanguage(language: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage can be blocked; the choice then lasts until the next reload.
  }
}
