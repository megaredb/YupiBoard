import { useCallback, useState } from "react";
import { googleAuthApiV1AuthGooglePost } from "@/shared/api/generated/endpoints/auth/auth";
import type { TokenResponse } from "@/shared/api/generated/model";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { getActiveLocale } from "@/shared/i18n/active-locale";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import {
  GoogleSignInError,
  renderGoogleButton,
  requestNativeGoogleIdToken,
  type GoogleButtonText,
} from "@/shared/platform/google-sign-in";
import { isNativePlatform } from "@/shared/platform/is-native";
import { getResolvedTheme } from "@/shared/platform/theme";
import { useSignInMutation } from "@/features/auth/hooks/use-sign-in-mutation";
import { getSignInErrorKey } from "@/features/auth/lib/get-sign-in-error-key";

/**
 * The web shows the button Google renders into `buttonRef`. Android, and a web build without a
 * client ID (where a click reports that sign-in is unavailable), show our own button.
 */
export type GoogleSignInControl =
  | { kind: "custom"; signIn: () => void }
  | { kind: "web"; buttonRef: (container: HTMLDivElement | null) => (() => void) | undefined };

interface UseGoogleSignInResult {
  control: GoogleSignInControl;
  isPending: boolean;
  errorKey: TranslationKey | null;
}

async function exchangeIdToken(getIdToken: () => Promise<string>): Promise<TokenResponse> {
  return googleAuthApiV1AuthGooglePost({ id_token: await getIdToken() });
}

function requireClientId(clientId: string | null): string {
  if (!clientId) throw new GoogleSignInError("unavailable");
  return clientId;
}

export function useGoogleSignIn(
  redirectTo: string | undefined,
  buttonText: GoogleButtonText,
): UseGoogleSignInResult {
  const mutation = useSignInMutation(exchangeIdToken, redirectTo);
  const [webFailure, setWebFailure] = useState<GoogleSignInError | null>(null);
  const { googleClientId } = getRuntimeConfig();
  const { mutate } = mutation;
  const locale = getActiveLocale();

  // Stable reference required: a new ref callback on every render would make React tear down
  // and re-render Google's button each time.
  const buttonRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container || !googleClientId) return undefined;
      return renderGoogleButton(container, {
        clientId: googleClientId,
        text: buttonText,
        locale,
        isDark: getResolvedTheme() === "dark",
        onIdToken: (idToken) => {
          setWebFailure(null);
          mutate(() => Promise.resolve(idToken));
        },
        onFailure: setWebFailure,
      });
    },
    [googleClientId, buttonText, locale, mutate],
  );

  const control: GoogleSignInControl =
    isNativePlatform() || !googleClientId
      ? {
          kind: "custom",
          signIn: () =>
            mutate(async () => requestNativeGoogleIdToken(requireClientId(googleClientId))),
        }
      : { kind: "web", buttonRef };
  const failure: unknown = mutation.isError ? mutation.error : webFailure;

  return {
    control,
    isPending: mutation.isPending,
    errorKey: failure
      ? getSignInErrorKey(failure, "auth.google.failed", { 403: "errors.accountBanned" })
      : null,
  };
}
