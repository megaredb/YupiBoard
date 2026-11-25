import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import {
  PASSWORD_LIMITS,
  PASSWORD_MISMATCH_ISSUE,
  passwordConfirmationSchema,
  passwordSchema,
  passwordsMatch,
} from "@/shared/lib/validators/password";

/** Only for accounts that have a password; Google-only accounts set one through password reset. */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "validation.passwordRequired" satisfies TranslationKey)
      .max(PASSWORD_LIMITS.max, "validation.passwordMax" satisfies TranslationKey),
    password: passwordSchema,
    confirmPassword: passwordConfirmationSchema,
  })
  .refine(passwordsMatch, PASSWORD_MISMATCH_ISSUE);

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
