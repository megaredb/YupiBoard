import { CalendarCheck, Compass, ReceiptText, UserRound, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/shared/i18n/translation-key";

export const NAV_ITEMS = [
  { to: "/events", labelKey: "shell.nav.events", isMemberOnly: false, isAdminOnly: false },
  { to: "/my-events", labelKey: "shell.nav.myEvents", isMemberOnly: true, isAdminOnly: false },
  { to: "/my-bookings", labelKey: "shell.nav.myBookings", isMemberOnly: true, isAdminOnly: false },
  { to: "/favorites", labelKey: "shell.nav.favorites", isMemberOnly: true, isAdminOnly: false },
  { to: "/moderation", labelKey: "shell.nav.moderation", isMemberOnly: true, isAdminOnly: true },
] as const satisfies readonly {
  to: string;
  labelKey: TranslationKey;
  isMemberOnly: boolean;
  isAdminOnly: boolean;
}[];

export type NavItem = (typeof NAV_ITEMS)[number];

/** Phone bottom tabs; Favorites lives in the Profile tab there. */
export const TAB_BAR_ITEMS = [
  { to: "/events", labelKey: "shell.nav.events", icon: Compass },
  { to: "/my-events", labelKey: "shell.nav.myEvents", icon: CalendarCheck },
  { to: "/my-bookings", labelKey: "shell.nav.myBookings", icon: ReceiptText },
  { to: "/profile", labelKey: "shell.nav.profile", icon: UserRound },
] as const satisfies readonly { to: string; labelKey: TranslationKey; icon: LucideIcon }[];
