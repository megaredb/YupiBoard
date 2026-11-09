import { App } from "@capacitor/app";
import { isNativePlatform } from "@/shared/platform/is-native";

/** Android hardware back button; a no-op subscription on web. */
export function onBackButton(handler: () => void): () => void {
  if (!isNativePlatform()) return () => {};
  const listener = App.addListener("backButton", handler);
  return () => void listener.then((handle) => handle.remove());
}

export function exitApp(): void {
  if (isNativePlatform()) void App.exitApp();
}
