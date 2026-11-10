import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/shared/i18n/resources";
import { storeLanguage } from "@/shared/platform/language-preference";

export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

/** First candidate ("uk-UA", "en") the app has translations for. */
export function pickLanguage(candidates: readonly (string | null)[]): SupportedLanguage {
  for (const candidate of candidates) {
    const base = candidate?.toLowerCase().split("-")[0];
    const match = SUPPORTED_LANGUAGES.find((language) => language === base);
    if (match) return match;
  }
  return FALLBACK_LANGUAGE;
}

export function useActiveLanguage(): SupportedLanguage {
  const { i18n } = useTranslation();
  return pickLanguage([i18n.resolvedLanguage ?? i18n.language]);
}

/** With two languages a toggle is enough; a third would need a picker instead. */
export function getNextLanguage(language: SupportedLanguage): SupportedLanguage {
  const index = SUPPORTED_LANGUAGES.indexOf(language);
  return SUPPORTED_LANGUAGES[(index + 1) % SUPPORTED_LANGUAGES.length] ?? FALLBACK_LANGUAGE;
}

/** Overrides the device language from now on. */
export function changeLanguage(language: SupportedLanguage): void {
  storeLanguage(language);
  void i18next.changeLanguage(language);
}
