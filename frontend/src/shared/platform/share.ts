import { Share } from "@capacitor/share";
import { isNativePlatform } from "@/shared/platform/is-native";

export type ShareResult = "shared" | "copied" | "cancelled";

function isUserCancel(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function shareOnWeb(title: string, url: string): Promise<ShareResult> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      if (isUserCancel(error)) return "cancelled";
      throw error;
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

async function shareOnNative(title: string, url: string): Promise<ShareResult> {
  try {
    await Share.share({ title, url });
    return "shared";
  } catch {
    // The plugin rejects when the user closes the share sheet.
    return "cancelled";
  }
}

/** Opens the system share sheet, or copies the link where sharing is unavailable. */
export function shareLink(title: string, url: string): Promise<ShareResult> {
  return isNativePlatform() ? shareOnNative(title, url) : shareOnWeb(title, url);
}
