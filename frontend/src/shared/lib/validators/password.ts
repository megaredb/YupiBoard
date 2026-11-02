import { z } from "zod"
import type { TranslationKey } from "@/shared/i18n/translation-key"

/** Mirrors `RegisterRequest.password` / `new_password` in the OpenAPI schema. */
export const PASSWORD_LIMITS = { min: 8, max: 128 } as const

export const passwordSchema = z
  .string()
  .min(PASSWORD_LIMITS.min, "validation.passwordMin" satisfies TranslationKey)
  .max(PASSWORD_LIMITS.max, "validation.passwordMax" satisfies TranslationKey)

export const passwordConfirmationSchema = z
  .string()
  .min(1, "validation.confirmRequired" satisfies TranslationKey)

export function passwordsMatch(values: { password: string; confirmPassword: string }): boolean {
  return values.password === values.confirmPassword
}

export const PASSWORD_MISMATCH_ISSUE = {
  message: "validation.mismatch" satisfies TranslationKey,
  path: ["confirmPassword"],
}
