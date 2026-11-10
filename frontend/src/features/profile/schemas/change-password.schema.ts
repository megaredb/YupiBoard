import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import {
  PASSWORD_LIMITS,
  PASSWORD_MISMATCH_ISSUE,
  passwordConfirmationSchema,
  passwordSchema,
  passwordsMatch,
} from "@/shared/lib/validators/password";

/**
 * The current password is optional: accounts created with Google have none, and `UserRead` does
 * not say which kind the user has, so the backend decides (400 when it is required and wrong).
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .max(PASSWORD_LIMITS.max, "validation.passwordMax" satisfies TranslationKey),
    password: passwordSchema,
    confirmPassword: passwordConfirmationSchema,
  })
  .refine(passwordsMatch, PASSWORD_MISMATCH_ISSUE);

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
