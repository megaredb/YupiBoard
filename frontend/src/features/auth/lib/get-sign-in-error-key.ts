import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { GoogleSignInError, type GoogleSignInFailure } from "@/shared/platform/google-sign-in";
import { AccountBannedError } from "@/features/auth/api/session-lifecycle";

const GOOGLE_FAILURE_KEYS = {
  cancelled: "auth.google.cancelled",
  unavailable: "auth.google.unavailable",
  unsupported: "auth.google.unsupported",
} as const satisfies Record<GoogleSignInFailure, TranslationKey>;

export function getSignInErrorKey(
  error: unknown,
  fallback: TranslationKey,
  byStatus?: Partial<Record<number, TranslationKey>>,
): TranslationKey {
  if (error instanceof AccountBannedError) return "errors.accountBanned";
  if (error instanceof GoogleSignInError) return GOOGLE_FAILURE_KEYS[error.reason];
  return getApiErrorKey(error, fallback, byStatus);
}
