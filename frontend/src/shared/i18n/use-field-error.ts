import { useTranslation } from "react-i18next"
import { isTranslationKey } from "@/shared/i18n/translation-key"

/** Translates a form error message, which by convention is a translation key. */
export function useFieldError(): (message?: string) => string | undefined {
  const { t } = useTranslation()
  return (message) => (message && isTranslationKey(message) ? t(message) : undefined)
}
