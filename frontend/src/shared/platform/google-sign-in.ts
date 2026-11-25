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

/** Which Google-provided wording the web button shows. */
export type GoogleButtonText = "continue_with" | "signup_with";

interface GoogleButtonOptions {
  type: "standard";
  theme: "outline" | "filled_black";
  size: "large";
  shape: "rectangular";
  text: GoogleButtonText;
  width: number;
  locale: string;
}

interface GoogleIdentity {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

const SDK_URL = "https://accounts.google.com/gsi/client";
// Width limits of Google's rendered button.
const BUTTON_MIN_WIDTH = 200;
const BUTTON_MAX_WIDTH = 400;
let sdkLoading: Promise<GoogleIdentity> | null = null;

/**
 * `hl` sets the language of the placeholder the SDK draws before its iframe loads (Google guesses
 * one without it). The SDK is loaded once per page: Google does not support loading it twice, so
 * after a language switch only the iframe, which follows `renderButton`'s `locale`, changes.
 */
function loadSdk(locale: string): Promise<GoogleIdentity> {
  sdkLoading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${SDK_URL}?hl=${encodeURIComponent(locale)}`;
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

export interface GoogleButtonConfig {
  clientId: string;
  text: GoogleButtonText;
  locale: string;
  isDark: boolean;
  onIdToken: (idToken: string) => void;
  onFailure: (error: GoogleSignInError) => void;
}

/**
 * Web: renders Google's own sign-in button into `container`. One Tap (`prompt()`) is not used:
 * browsers without third-party cookies or FedCM never show it, and after a dismissal Google
 * suppresses it for hours, which would leave the button dead. Returns a cleanup function.
 */
export function renderGoogleButton(container: HTMLElement, config: GoogleButtonConfig): () => void {
  let isActive = true;
  loadSdk(config.locale)
    .then((identity) => {
      if (!isActive) return;
      identity.initialize({
        client_id: config.clientId,
        callback: ({ credential }) => {
          if (credential) config.onIdToken(credential);
          else config.onFailure(new GoogleSignInError("cancelled"));
        },
      });
      const width = Math.min(Math.max(container.clientWidth, BUTTON_MIN_WIDTH), BUTTON_MAX_WIDTH);
      identity.renderButton(container, {
        type: "standard",
        theme: config.isDark ? "filled_black" : "outline",
        size: "large",
        shape: "rectangular",
        text: config.text,
        width,
        locale: config.locale,
      });
    })
    .catch(() => {
      if (isActive) config.onFailure(new GoogleSignInError("unavailable"));
    });
  return () => {
    isActive = false;
    container.replaceChildren();
  };
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
 * the one the backend verifies; Google matches the app to its Android OAuth client by package
 * name and signing-certificate SHA-1. The authorization step is skipped: only the `idToken` is
 * needed, and the stock `BridgeActivity` cannot route that step's consent screen.
 */
export async function requestNativeGoogleIdToken(clientId: string): Promise<string> {
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

/** Clears cached native Google credentials on logout; no-op on web. */
export async function signOutGoogle(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await SocialLogin.logout({ provider: "google" });
  } catch {
    // Best-effort cleanup; ignore when the plugin was never initialized.
  }
}
