import { z } from "zod";
import { isNativePlatform } from "@/shared/platform/is-native";

const envSchema = z.object({
  VITE_API_BASE_URL: z.url(),
  // Optional: the backend origin as seen from the Android app. A device cannot forward its port
  // 443 to the dev machine, so local testing goes through another port (see `pnpm cap:run`).
  VITE_ANDROID_API_BASE_URL: z.url().optional(),
  VITE_PUBLIC_WEB_URL: z.url(),
  // Optional so the app runs without Google sign-in configured; the button then reports it.
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
});

export interface Env {
  apiBaseUrl: string;
  publicWebUrl: string;
  googleClientId: string | null;
}

/** The only reader of `import.meta.env` (SEC-1). Throws on missing or malformed values. */
export function readEnv(): Env {
  const parsed = envSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  }
  const { VITE_API_BASE_URL, VITE_ANDROID_API_BASE_URL } = parsed.data;
  return {
    apiBaseUrl:
      isNativePlatform() && VITE_ANDROID_API_BASE_URL
        ? VITE_ANDROID_API_BASE_URL
        : VITE_API_BASE_URL,
    publicWebUrl: parsed.data.VITE_PUBLIC_WEB_URL,
    googleClientId: parsed.data.VITE_GOOGLE_CLIENT_ID || null,
  };
}
