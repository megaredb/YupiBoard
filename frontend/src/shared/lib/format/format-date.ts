import { getActiveLocale } from "@/shared/i18n/active-locale";

// The API sends UTC timestamps; every formatter shows them in the device's time zone.

/** "Sat, Nov 7 · 17:00" in the active locale. */
export function formatCardDate(iso: string): string {
  const day = new Intl.DateTimeFormat(getActiveLocale(), {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
  return `${day} · ${formatTime(iso)}`;
}

/** "Saturday, November 7, 2026" */
export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/** "17:00" */
function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** "18:00 – 22:00" (end time omitted when unknown). */
export function formatTimeRange(startsAt: string, endsAt: string | null): string {
  const start = formatTime(startsAt);
  return endsAt ? `${start} – ${formatTime(endsAt)}` : start;
}

/** "Eastern European Time": the device's time zone as of `iso`, named in the active locale. */
export function formatTimeZoneName(iso: string): string {
  const parts = new Intl.DateTimeFormat(getActiveLocale(), {
    timeZoneName: "longGeneric",
  }).formatToParts(new Date(iso));
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

/** "Nov 2026", or `null` for an unparsable date. */
export function formatMonthYear(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(getActiveLocale(), { month: "short", year: "numeric" }).format(
    date,
  );
}

/** "Oct 30, 14:25" in the active locale. */
export function formatShortDateTime(iso: string): string {
  const day = new Intl.DateTimeFormat(getActiveLocale(), {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
  return `${day}, ${formatTime(iso)}`;
}
