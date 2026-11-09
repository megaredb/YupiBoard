import { isNativePlatform } from "@/shared/platform/is-native";

/**
 * Opens a page outside the app. Web: a new tab. Android: navigating the WebView to another origin
 * makes Capacitor hand the URL to the system, which opens the browser or the matching app (Maps).
 */
export function openExternalUrl(url: string): void {
  if (isNativePlatform()) window.location.assign(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}
