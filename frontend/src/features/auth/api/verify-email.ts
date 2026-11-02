import { verifyEmailApiV1AuthVerifyEmailPost } from "@/shared/api/generated/endpoints/auth/auth"
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key"
import type { TranslationKey } from "@/shared/i18n/translation-key"

export type VerifyEmailResult =
  | { status: "verified" }
  | { status: "missing-token" }
  | { status: "failed"; errorKey: TranslationKey }

/** Loader of `/verify-email`: the token is single-use, so the route never re-runs it (staleTime). */
export async function verifyEmailToken(token: string | undefined): Promise<VerifyEmailResult> {
  if (!token) return { status: "missing-token" }
  try {
    await verifyEmailApiV1AuthVerifyEmailPost({ token })
    return { status: "verified" }
  } catch (error) {
    return {
      status: "failed",
      errorKey: getApiErrorKey(error, "auth.verifyEmail.failed", {
        400: "auth.verifyEmail.invalidToken",
      }),
    }
  }
}
