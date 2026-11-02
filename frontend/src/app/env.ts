import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.url(),
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
  return {
    apiBaseUrl: parsed.data.VITE_API_BASE_URL,
    publicWebUrl: parsed.data.VITE_PUBLIC_WEB_URL,
    googleClientId: parsed.data.VITE_GOOGLE_CLIENT_ID || null,
  };
}
