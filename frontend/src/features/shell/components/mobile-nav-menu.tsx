import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DropdownMenu } from "@/shared/ui/dropdown-menu";
import { NAV_ITEMS } from "@/features/shell/lib/nav-items";

const ACTIVE_ITEM = { className: "text-primary" };

export function MobileNavMenu() {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        aria-label={t("shell.nav.open")}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground md:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start">
        {NAV_ITEMS.map((item) => (
          <DropdownMenu.Item key={item.to} render={<Link to={item.to} activeProps={ACTIVE_ITEM} />}>
            {t(item.labelKey)}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
