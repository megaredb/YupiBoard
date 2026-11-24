import type { TranslationKey } from "@/shared/i18n/translation-key";

export type ResetTokenState = "missing" | "invalid" | "expired" | "used" | "usable";

const TOKEN_FAILURE_KEYS = {
  missing: "auth.resetPassword.missingToken",
  invalid: "auth.resetPassword.invalidToken",
  expired: "auth.resetPassword.expiredToken",
  used: "auth.resetPassword.usedToken",
} as const satisfies Record<Exclude<ResetTokenState, "usable">, TranslationKey>;

export function getResetFailureKey(
  tokenState: ResetTokenState,
  isRejectedByServer: boolean,
): TranslationKey | null {
  if (tokenState !== "usable") return TOKEN_FAILURE_KEYS[tokenState];
  return isRejectedByServer ? "auth.resetPassword.usedToken" : null;
}
