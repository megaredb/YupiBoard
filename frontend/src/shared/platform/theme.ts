import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativePlatform } from "@/shared/platform/is-native";

export type ResolvedTheme = "light" | "dark";
type ThemePreference = ResolvedTheme | "system";

// Must match the inline pre-paint script in index.html.
const STORAGE_KEY = "yupiboard:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function getResolvedTheme(): ResolvedTheme {
  const preference = readPreference();
  return preference === "system" ? systemTheme() : preference;
}

function applyTheme(): void {
  const theme = getResolvedTheme();
  document.documentElement.classList.toggle("dark", theme === "dark");
  if (isNativePlatform()) {
    // `Style.Dark` means light status-bar text, for dark backgrounds.
    void StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
  }
  listeners.forEach((listener) => listener());
}

/** Persists an explicit choice; it overrides the system preference from then on. */
export function setTheme(theme: ResolvedTheme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called once from `bootstrap()`: applies the theme and follows system changes. */
export function initTheme(): () => void {
  applyTheme();
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", applyTheme);
  return () => media.removeEventListener("change", applyTheme);
}
