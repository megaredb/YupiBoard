import { z } from "zod"
import type { TranslationKey } from "@/shared/i18n/translation-key"

export const CONTACT_INFO_MAX_LENGTH = 120

export const contactInfoSchema = z
  .string()
  .trim()
  .max(CONTACT_INFO_MAX_LENGTH, "validation.contactTooLong" satisfies TranslationKey)
