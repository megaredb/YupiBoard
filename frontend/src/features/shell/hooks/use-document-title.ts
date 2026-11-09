import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { setDocumentTitle } from "@/shared/platform/document-title";

/** Keeps `document.title` in sync with the current route (A11Y-4). */
export function useDocumentTitle(titleKey: TranslationKey | null): void {
  const { t } = useTranslation();
  const brand = t("common.brand");
  const title = titleKey ? t("shell.titleFormat", { page: t(titleKey), brand }) : brand;

  useEffect(() => setDocumentTitle(title), [title]);
}
