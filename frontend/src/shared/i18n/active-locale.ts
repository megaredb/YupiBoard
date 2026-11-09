import i18next from "i18next";

/** BCP 47 tag of the active language for `Intl` formatters. */
export function getActiveLocale(): string {
  return i18next.resolvedLanguage ?? i18next.language;
}
