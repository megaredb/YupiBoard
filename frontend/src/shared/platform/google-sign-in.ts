import { isNativePlatform } from "@/shared/platform/is-native";

export type GoogleSignInFailure = "unsupported" | "unavailable" | "cancelled";

export class GoogleSignInError extends Error {
  readonly reason: GoogleSignInFailure;

  constructor(reason: GoogleSignInFailure) {
    super(`Google sign-in failed: ${reason}`);
    this.name = "GoogleSignInError";
    this.reason = reason;
  }
}

interface PromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
}

interface GoogleIdentity {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  prompt: (listener: (notification: PromptNotification) => void) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

const SDK_URL = "https://accounts.google.com/gsi/client";
let sdkLoading: Promise<GoogleIdentity> | null = null;

function loadSdk(): Promise<GoogleIdentity> {
  sdkLoading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      const identity = window.google?.accounts?.id;
      if (identity) resolve(identity);
      else reject(new GoogleSignInError("unavailable"));
    };
    script.onerror = () => reject(new GoogleSignInError("unavailable"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    sdkLoading = null;
    throw error;
  });
  return sdkLoading;
}

async function requestOnWeb(clientId: string): Promise<string> {
  const identity = await loadSdk();
  return new Promise<string>((resolve, reject) => {
    identity.initialize({
      client_id: clientId,
      callback: ({ credential }) =>
        credential ? resolve(credential) : reject(new GoogleSignInError("cancelled")),
    });
    identity.prompt((notification) => {
      if (notification.isNotDisplayed()) reject(new GoogleSignInError("unavailable"));
      else if (notification.isSkippedMoment()) reject(new GoogleSignInError("cancelled"));
    });
  });
}

/**
 * The single social sign-in entry point: resolves Google's `idToken` for the backend.
 * Android has no sign-in plugin yet, so it rejects with `unsupported`.
 */
export function requestGoogleIdToken(clientId: string): Promise<string> {
  if (isNativePlatform()) return Promise.reject(new GoogleSignInError("unsupported"));
  return requestOnWeb(clientId);
}
