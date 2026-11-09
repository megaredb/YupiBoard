import "i18next";
import type { TranslationResources } from "@/shared/i18n/resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: TranslationResources };
  }
}
