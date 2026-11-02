import i18next, { type ParseKeys } from "i18next"

export type TranslationKey = ParseKeys

/** Narrows a key carried as data (e.g. a zod message) to a typed key, checked at runtime. */
export function isTranslationKey(value: string): value is TranslationKey {
  return i18next.exists(value)
}
