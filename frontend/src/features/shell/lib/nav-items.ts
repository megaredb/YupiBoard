import type { TranslationKey } from "@/shared/i18n/translation-key"

export const NAV_ITEMS = [
  { to: "/events", labelKey: "shell.nav.events" },
  { to: "/my-events", labelKey: "shell.nav.myEvents" },
  { to: "/my-bookings", labelKey: "shell.nav.myBookings" },
  { to: "/favorites", labelKey: "shell.nav.favorites" },
] as const satisfies readonly { to: string; labelKey: TranslationKey }[]
