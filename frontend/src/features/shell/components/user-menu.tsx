import { Link } from "@tanstack/react-router";
import { Globe, LogOut, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserRead } from "@/shared/api/generated/model";
import { DropdownMenu } from "@/shared/ui/dropdown-menu";
import { getDisplayName, UserAvatar } from "@/features/users";

interface UserMenuProps {
  user: UserRead;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const { t } = useTranslation();
  const name = getDisplayName(user);

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger aria-label={t("shell.userMenu.open")} className="rounded-full">
        <UserAvatar
          name={name}
          avatarUrl={user.avatar_url}
          className="size-9 border-0"
          fallbackClassName="text-xs"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <p className="truncate px-2.5 py-1.5 text-sm font-medium">{name}</p>
        <DropdownMenu.Separator />
        <DropdownMenu.Item render={<Link to="/profile" />}>
          <UserIcon aria-hidden />
          {t("shell.userMenu.myProfile")}
        </DropdownMenu.Item>
        <DropdownMenu.Item render={<Link to="/users/$userId" params={{ userId: user.id }} />}>
          <Globe aria-hidden />
          {t("shell.userMenu.publicProfile")}
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item variant="destructive" onClick={onLogout}>
          <LogOut aria-hidden />
          {t("shell.userMenu.logout")}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
