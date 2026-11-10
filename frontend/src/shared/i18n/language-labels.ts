import type { SupportedLanguage } from "@/shared/i18n/resources";

/** Each language is named in itself, so it is recognisable whatever the active language is. */
export const LANGUAGE_LABEL_KEYS = {
  en: { name: "shell.language.en", short: "shell.language.enShort" },
  uk: { name: "shell.language.uk", short: "shell.language.ukShort" },
} as const satisfies Record<SupportedLanguage, { name: string; short: string }>;
