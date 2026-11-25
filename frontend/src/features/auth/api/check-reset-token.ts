import { validateResetPasswordTokenApiV1AuthResetPasswordValidateGet } from "@/shared/api/generated/endpoints/auth/auth";
import type { ResetTokenState } from "@/features/auth/lib/reset-token-state";

export async function checkResetToken(
  token: string | undefined,
  signal?: AbortSignal,
): Promise<ResetTokenState> {
  if (!token) return "missing";
  const result = await validateResetPasswordTokenApiV1AuthResetPasswordValidateGet(
    { token },
    undefined,
    signal,
  ).catch(() => null); // Offline or server error: show the form; submitting re-checks the token.
  if (result === null || result.reason === "valid") return "usable";
  return result.reason;
}
