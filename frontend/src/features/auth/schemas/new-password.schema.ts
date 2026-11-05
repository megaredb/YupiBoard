import { z } from "zod";
import {
  PASSWORD_MISMATCH_ISSUE,
  passwordConfirmationSchema,
  passwordSchema,
  passwordsMatch,
} from "@/shared/lib/validators/password";

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordConfirmationSchema,
  })
  .refine(passwordsMatch, PASSWORD_MISMATCH_ISSUE);

export type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;
