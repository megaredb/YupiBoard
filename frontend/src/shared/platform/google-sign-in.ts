import { SocialLogin } from "@capgo/capacitor-social-login";
import { isNativePlatform } from "@/shared/platform/is-native";

export type GoogleSignInFailure = "unavailable" | "cancelled";

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

// Rejection code of the native plugin when the user closes the account picker.
const NATIVE_CANCELLED_CODE = "USER_CANCELLED";
let nativeReady: Promise<void> | null = null;

function isNativeCancellation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === NATIVE_CANCELLED_CODE
  );
}

/**
 * Android Credential Manager. Initialised with the *web* client ID so the `idToken` audience is
 * the one the backend verifies. The authorization step is skipped: only the `idToken` is needed,
 * and the stock `BridgeActivity` cannot route that step's consent screen.
 */
async function requestOnAndroid(clientId: string): Promise<string> {
  nativeReady ??= SocialLogin.initialize({
    google: { webClientId: clientId, skipAuthOnlyAuthorizationAfterSignIn: true },
  }).catch((error: unknown) => {
    nativeReady = null;
    throw error;
  });
  const response = await nativeReady
    .then(() => SocialLogin.login({ provider: "google", options: {} }))
    .catch((error: unknown) => {
      throw new GoogleSignInError(isNativeCancellation(error) ? "cancelled" : "unavailable");
    });
  const { result } = response;
  if (result.responseType !== "online" || !result.idToken) {
    throw new GoogleSignInError("unavailable");
  }
  return result.idToken;
}

/** The single social sign-in entry point: resolves Google's `idToken` for the backend. */
export function requestGoogleIdToken(clientId: string): Promise<string> {
  return isNativePlatform() ? requestOnAndroid(clientId) : requestOnWeb(clientId);
}
