import { Capacitor } from "@capacitor/core";

/**
 * `<html data-platform="android">` (or `"web"`), so stylesheets can target the Android WebView
 * without components branching on the platform. Called once from `bootstrap()`.
 */
export function initPlatformAttribute(): void {
  document.documentElement.dataset.platform = Capacitor.getPlatform();
}
