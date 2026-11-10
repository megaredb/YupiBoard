import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { FALLBACK_LANGUAGE, pickLanguage } from "@/shared/i18n/language";
import { resources, SUPPORTED_LANGUAGES } from "@/shared/i18n/resources";
import { getDeviceLanguages } from "@/shared/platform/device-language";
import { setDocumentLanguage } from "@/shared/platform/document-language";
import { readStoredLanguage } from "@/shared/platform/language-preference";

export async function initI18n(): Promise<void> {
  i18next.on("languageChanged", setDocumentLanguage);
  await i18next.use(initReactI18next).init({
    resources,
    lng: pickLanguage([readStoredLanguage(), ...getDeviceLanguages()]),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}
