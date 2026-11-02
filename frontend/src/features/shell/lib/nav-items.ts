import type { TranslationKey } from "@/shared/i18n/translation-key";

export const NAV_ITEMS = [
  { to: "/events", labelKey: "shell.nav.events", isMemberOnly: false },
  { to: "/my-events", labelKey: "shell.nav.myEvents", isMemberOnly: true },
  { to: "/my-bookings", labelKey: "shell.nav.myBookings", isMemberOnly: true },
  { to: "/favorites", labelKey: "shell.nav.favorites", isMemberOnly: true },
] as const satisfies readonly { to: string; labelKey: TranslationKey; isMemberOnly: boolean }[];

export type NavItem = (typeof NAV_ITEMS)[number];
