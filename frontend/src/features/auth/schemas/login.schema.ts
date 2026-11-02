import { z } from "zod"
import type { TranslationKey } from "@/shared/i18n/translation-key"
import { emailSchema } from "@/shared/lib/validators/email"

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "validation.passwordRequired" satisfies TranslationKey),
})

export type LoginFormValues = z.infer<typeof loginSchema>
