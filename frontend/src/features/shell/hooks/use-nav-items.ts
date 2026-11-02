import { useCurrentUser } from "@/features/auth";
import { NAV_ITEMS, type NavItem } from "@/features/shell/lib/nav-items";

/** Guests only see the pages they can open without signing in. */
export function useNavItems(): readonly NavItem[] {
  const user = useCurrentUser();
  return user ? NAV_ITEMS : NAV_ITEMS.filter((item) => !item.isMemberOnly);
}
