import { App } from "@capacitor/app";
import { isNativePlatform } from "@/shared/platform/is-native";

/** Android App Links: hands the in-app path (`/verify-email?token=…`) to the router. */
export function onDeepLink(handler: (href: string) => void): () => void {
  if (!isNativePlatform()) return () => {};
  const listener = App.addListener("appUrlOpen", ({ url }) => {
    const parsed = new URL(url);
    handler(`${parsed.pathname}${parsed.search}`);
  });
  return () => void listener.then((handle) => handle.remove());
}
