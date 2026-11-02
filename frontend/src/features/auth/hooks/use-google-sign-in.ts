import { googleAuthApiV1AuthGooglePost } from "@/shared/api/generated/endpoints/auth/auth";
import type { TokenResponse } from "@/shared/api/generated/model";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { GoogleSignInError, requestGoogleIdToken } from "@/shared/platform/google-sign-in";
import { useSignInMutation } from "@/features/auth/hooks/use-sign-in-mutation";
import { getSignInErrorKey } from "@/features/auth/lib/get-sign-in-error-key";

interface UseGoogleSignInResult {
  signInWithGoogle: () => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
}

async function signInWithGoogleIdToken(): Promise<TokenResponse> {
  const { googleClientId } = getRuntimeConfig();
  if (!googleClientId) throw new GoogleSignInError("unavailable");
  const idToken = await requestGoogleIdToken(googleClientId);
  return googleAuthApiV1AuthGooglePost({ id_token: idToken });
}

export function useGoogleSignIn(redirectTo: string | undefined): UseGoogleSignInResult {
  const mutation = useSignInMutation(signInWithGoogleIdToken, redirectTo);
  return {
    signInWithGoogle: () => mutation.mutate(undefined),
    isPending: mutation.isPending,
    errorKey: mutation.isError ? getSignInErrorKey(mutation.error, "auth.google.failed") : null,
  };
}
