import { z } from "zod"
import type { TranslationKey } from "@/shared/i18n/translation-key"

/** Mirrors `UserUpdate.first_name` / `last_name` in the OpenAPI schema. */
export const PERSON_NAME_LIMITS = { min: 2, max: 50 } as const

const LETTERS_SPACES_APOSTROPHES_HYPHENS = /^[\p{L}\s'-]+$/u

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "validation.required" satisfies TranslationKey)
  .min(PERSON_NAME_LIMITS.min, "validation.nameTooShort" satisfies TranslationKey)
  .max(PERSON_NAME_LIMITS.max, "validation.nameTooLong" satisfies TranslationKey)
  .regex(LETTERS_SPACES_APOSTROPHES_HYPHENS, "validation.nameAlphabetic" satisfies TranslationKey)
