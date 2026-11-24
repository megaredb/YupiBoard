import { useCurrentUser } from "@/features/auth";
import { NAV_ITEMS, type NavItem } from "@/features/shell/lib/nav-items";

/** Guests only see the pages they can open without signing in; moderation is for admins. */
export function useNavItems(): readonly NavItem[] {
  const user = useCurrentUser();
  if (!user) return NAV_ITEMS.filter((item) => !item.isMemberOnly);
  return NAV_ITEMS.filter((item) => !item.isAdminOnly || user.is_superuser);
}
