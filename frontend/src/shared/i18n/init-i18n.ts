import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/shared/i18n/resources";
import { getDeviceLanguages } from "@/shared/platform/device-language";
import { setDocumentLanguage } from "@/shared/platform/document-language";

const FALLBACK_LANGUAGE: SupportedLanguage = "en";

function pickLanguage(candidates: readonly string[]): SupportedLanguage {
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split("-")[0];
    const match = SUPPORTED_LANGUAGES.find((language) => language === base);
    if (match) return match;
  }
  return FALLBACK_LANGUAGE;
}

export async function initI18n(): Promise<void> {
  i18next.on("languageChanged", setDocumentLanguage);
  await i18next.use(initReactI18next).init({
    resources,
    lng: pickLanguage(getDeviceLanguages()),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}
