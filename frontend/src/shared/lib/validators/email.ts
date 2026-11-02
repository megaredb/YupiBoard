import { z } from "zod"
import type { TranslationKey } from "@/shared/i18n/translation-key"

export const emailSchema = z.email("validation.email" satisfies TranslationKey)
