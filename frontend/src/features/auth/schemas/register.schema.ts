import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { emailSchema } from "@/shared/lib/validators/email";
import {
  PASSWORD_MISMATCH_ISSUE,
  passwordConfirmationSchema,
  passwordSchema,
  passwordsMatch,
} from "@/shared/lib/validators/password";

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordConfirmationSchema,
    isAdult: z.boolean().refine((value) => value, {
      message: "validation.ageRequired" satisfies TranslationKey,
    }),
  })
  .refine(passwordsMatch, PASSWORD_MISMATCH_ISSUE);

export type RegisterFormInput = z.input<typeof registerSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
