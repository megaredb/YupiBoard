import enAuth from "@/shared/i18n/locales/en/auth.json";
import enCommon from "@/shared/i18n/locales/en/common.json";
import enErrors from "@/shared/i18n/locales/en/errors.json";
import enEvents from "@/shared/i18n/locales/en/events.json";
import enNotifications from "@/shared/i18n/locales/en/notifications.json";
import enProfile from "@/shared/i18n/locales/en/profile.json";
import enShell from "@/shared/i18n/locales/en/shell.json";
import enValidation from "@/shared/i18n/locales/en/validation.json";
import ukAuth from "@/shared/i18n/locales/uk/auth.json";
import ukCommon from "@/shared/i18n/locales/uk/common.json";
import ukErrors from "@/shared/i18n/locales/uk/errors.json";
import ukEvents from "@/shared/i18n/locales/uk/events.json";
import ukNotifications from "@/shared/i18n/locales/uk/notifications.json";
import ukProfile from "@/shared/i18n/locales/uk/profile.json";
import ukShell from "@/shared/i18n/locales/uk/shell.json";
import ukValidation from "@/shared/i18n/locales/uk/validation.json";

const en = {
  auth: enAuth,
  common: enCommon,
  errors: enErrors,
  events: enEvents,
  notifications: enNotifications,
  profile: enProfile,
  shell: enShell,
  validation: enValidation,
};

export type TranslationResources = typeof en;

const uk = {
  auth: ukAuth,
  common: ukCommon,
  errors: ukErrors,
  events: ukEvents,
  notifications: ukNotifications,
  profile: ukProfile,
  shell: ukShell,
  validation: ukValidation,
};

export const SUPPORTED_LANGUAGES = ["en", "uk"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const resources = {
  en: { translation: en },
  uk: { translation: uk },
};
