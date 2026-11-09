import i18next from "i18next";

export function getActiveLocale(): string {
  return i18next.resolvedLanguage ?? i18next.language;
}
