import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeLanguage, getNextLanguage, useActiveLanguage } from "@/shared/i18n/language";
import { LANGUAGE_LABEL_KEYS } from "@/shared/i18n/language-labels";
import { Button } from "@/shared/ui/button";

export function LanguageToggle() {
  const { t } = useTranslation();
  const language = useActiveLanguage();
  const next = getNextLanguage(language);
  const handleSwitchLanguage = () => changeLanguage(next);

  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      aria-label={t("shell.language.switchTo", { language: t(LANGUAGE_LABEL_KEYS[next].name) })}
      onClick={handleSwitchLanguage}
      className="gap-1.5 px-2 text-muted-foreground"
    >
      <Languages aria-hidden className="size-5" />
      <span aria-hidden>{t(LANGUAGE_LABEL_KEYS[language].short)}</span>
    </Button>
  );
}
