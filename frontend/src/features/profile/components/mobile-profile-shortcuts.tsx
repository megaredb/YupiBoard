import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Globe, Heart, Languages, LogOut, Moon, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useResolvedTheme } from "@/shared/hooks/use-theme";
import { changeLanguage, getNextLanguage, useActiveLanguage } from "@/shared/i18n/language";
import { LANGUAGE_LABEL_KEYS } from "@/shared/i18n/language-labels";
import { cn } from "@/shared/lib/cn";
import { setTheme } from "@/shared/platform/theme";
import { Card } from "@/shared/ui/card";
import { useLogout } from "@/features/auth";

const ROW_CLASS =
  "flex min-h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted [&>svg:first-child]:size-4 [&>svg:first-child]:text-muted-foreground";

function RowLabel({ children }: { children: ReactNode }) {
  return <span className="flex-1">{children}</span>;
}

/** Phone-only: what the desktop header and user menu offer, reached from the Profile tab. */
export function MobileProfileShortcuts({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const isDark = useResolvedTheme() === "dark";
  const { logout } = useLogout();
  const language = useActiveLanguage();
  const nextLanguage = getNextLanguage(language);
  const handleToggleTheme = () => setTheme(isDark ? "light" : "dark");
  const handleSwitchLanguage = () => changeLanguage(nextLanguage);
  const switchLanguageLabel = t("shell.language.switchTo", {
    language: t(LANGUAGE_LABEL_KEYS[nextLanguage].name),
  });
  const chevron = <ChevronRight aria-hidden className="size-4 text-muted-foreground" />;

  return (
    <Card className="gap-0 divide-y divide-border py-0 desktop:hidden">
      <nav aria-label={t("profile.shortcutsLabel")} className="divide-y divide-border">
        <Link to="/events/new" className={ROW_CLASS}>
          <Plus aria-hidden />
          <RowLabel>{t("shell.createEvent")}</RowLabel>
          {chevron}
        </Link>
        <Link to="/favorites" className={ROW_CLASS}>
          <Heart aria-hidden />
          <RowLabel>{t("shell.nav.favorites")}</RowLabel>
          {chevron}
        </Link>
        <Link to="/users/$userId" params={{ userId }} className={ROW_CLASS}>
          <Globe aria-hidden />
          <RowLabel>{t("shell.userMenu.publicProfile")}</RowLabel>
          {chevron}
        </Link>
      </nav>
      <button type="button" aria-pressed={isDark} onClick={handleToggleTheme} className={ROW_CLASS}>
        <Moon aria-hidden />
        <RowLabel>{t("shell.darkTheme")}</RowLabel>
        {isDark && <Check aria-hidden className="size-4 text-primary" />}
      </button>
      <button
        type="button"
        aria-label={switchLanguageLabel}
        onClick={handleSwitchLanguage}
        className={ROW_CLASS}
      >
        <Languages aria-hidden />
        <RowLabel>{t("shell.language.label")}</RowLabel>
        <span className="text-muted-foreground">{t(LANGUAGE_LABEL_KEYS[language].name)}</span>
      </button>
      <button type="button" onClick={logout} className={cn(ROW_CLASS, "text-destructive")}>
        <LogOut aria-hidden />
        <RowLabel>{t("shell.userMenu.logout")}</RowLabel>
      </button>
    </Card>
  );
}
