import { z } from "zod";
import { emailSchema } from "@/shared/lib/validators/email";

export const passwordRecoverySchema = z.object({
  email: emailSchema,
});

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;
