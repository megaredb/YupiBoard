import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useResolvedTheme } from "@/shared/hooks/use-theme";
import { setTheme } from "@/shared/platform/theme";
import { Button } from "@/shared/ui/button";

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const isDark = theme === "dark";
  const handleToggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-pressed={isDark}
      aria-label={t("shell.darkTheme")}
      onClick={handleToggle}
      className="text-muted-foreground"
    >
      {isDark ? <Moon aria-hidden className="size-5" /> : <Sun aria-hidden className="size-5" />}
    </Button>
  );
}
