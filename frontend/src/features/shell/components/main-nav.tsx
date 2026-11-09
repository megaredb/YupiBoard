import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useNavItems } from "@/features/shell/hooks/use-nav-items";

const ACTIVE_LINK = { className: "text-primary" };
const INACTIVE_LINK = { className: "text-muted-foreground hover:text-foreground" };

/** Desktop navigation; phones use `MobileTabBar` and the Profile tab shortcuts. */
export function MainNav() {
  const { t } = useTranslation();
  const navItems = useNavItems();

  return (
    <nav aria-label={t("shell.nav.label")} className="ml-8 hidden items-center gap-6 md:flex">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeProps={ACTIVE_LINK}
          inactiveProps={INACTIVE_LINK}
          className="flex h-11 items-center text-sm font-medium whitespace-nowrap transition-colors"
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
