import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TAB_BAR_ITEMS } from "@/features/shell/lib/nav-items";

const ACTIVE_TAB = { className: "text-primary" };
const INACTIVE_TAB = { className: "text-muted-foreground" };

/** Phone navigation for signed-in users; desktop uses `MainNav`. */
export function MobileTabBar() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("shell.nav.label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur-md md:hidden keyboard-open:hidden"
    >
      <ul className="grid h-(--tab-bar-height) grid-cols-4">
        {TAB_BAR_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeProps={ACTIVE_TAB}
              inactiveProps={INACTIVE_TAB}
              className="flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
            >
              <Icon aria-hidden className="size-5" />
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
