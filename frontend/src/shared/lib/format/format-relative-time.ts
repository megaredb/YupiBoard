import { getActiveLocale } from "@/shared/i18n/active-locale";

const UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "day", seconds: 86_400 },
  { unit: "hour", seconds: 3_600 },
  { unit: "minute", seconds: 60 },
];

/** "2 hours ago", "3 days ago", "just now" in the active locale. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const formatter = new Intl.RelativeTimeFormat(getActiveLocale(), { numeric: "auto" });
  const elapsedSeconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  const match = UNITS.find(({ seconds }) => elapsedSeconds >= seconds);
  if (!match) return formatter.format(0, "second");
  return formatter.format(-Math.floor(elapsedSeconds / match.seconds), match.unit);
}
